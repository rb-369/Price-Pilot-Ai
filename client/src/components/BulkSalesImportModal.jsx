import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiUpload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../api';

export default function BulkSalesImportModal({ onClose, onSuccess }) {
  const [fileContent, setFileContent] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [mappingState, setMappingState] = useState('idle'); // idle | mapping | mapping_done | wizard | done_with_warnings
  const [validation, setValidation] = useState(null); // { valid: [], invalid: [] }
  const [isHistorical, setIsHistorical] = useState(false);
  const [missingProducts, setMissingProducts] = useState([]);
  const [currentMissingIndex, setCurrentMissingIndex] = useState(0);
  const [outOfStockWarnings, setOutOfStockWarnings] = useState([]);
  const fileInputRef = useRef(null);

  const parseCSVRaw = (csvText) => {
    try {
      const lines = csvText.trim().split('\n').filter(Boolean);
      if (lines.length < 2) return [];
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        if (values.length < headers.length) continue;
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx];
        });
        rows.push(rowObj);
      }
      return { headers, rows };
    } catch {
      return { headers: [], rows: [] };
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result || '';
      setFileContent(text);
      
      const { headers, rows } = parseCSVRaw(text);
      if (headers.length === 0 || rows.length === 0) {
          toast.error("File appears to be empty or improperly formatted.");
          return;
      }

      setMappingState('mapping');
      
      try {
          // Send first 5 rows to AI for mapping
          const sampleRows = rows.slice(0, 5);
          const mapRes = await api.post('/sales/map-columns', { headers, sampleRows });
          
          if (mapRes.data.success) {
              const aiMapping = mapRes.data.data; // { "productId": 0, "quantity": 3, ... }
              
              // Validate all rows locally using the AI mapping
              const valid = [];
              const invalid = [];

              rows.forEach((rowObj, index) => {
                  // Reconstruct based on mapping
                  const productId = rowObj[headers[aiMapping['productId']]];
                  const orderId = rowObj[headers[aiMapping['orderId']]];
                  const quantity = parseInt(rowObj[headers[aiMapping['quantity']]]);
                  const salePrice = parseFloat(rowObj[headers[aiMapping['salePrice']]]);
                  const purchasedAt = rowObj[headers[aiMapping['purchasedAt']]];

                  const mappedOrder = {
                      productId,
                      orderId,
                      quantity,
                      salePrice,
                      purchasedAt: purchasedAt || new Date().toISOString()
                  };

                  if (productId && orderId && !isNaN(quantity) && quantity > 0 && !isNaN(salePrice) && salePrice >= 0) {
                      valid.push(mappedOrder);
                  } else {
                      invalid.push({ row: index + 2, reason: 'Missing or invalid fields' });
                  }
              });

              setValidation({ valid, invalid });
              setMappingState('mapping_done');
          }
      } catch (error) {
          toast.error('AI Column mapping failed. Ensure the CSV has clear headers.');
          setMappingState('idle');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async (productsToCreate = null) => {
    if (!validation || validation.valid.length === 0) return;
    
    setImporting(true);
    let loadingToast = toast.loading('Importing sales data...');
    try {
      if (productsToCreate) {
          toast.loading('Creating missing products...', { id: loadingToast });
          await api.bulkImportProducts(productsToCreate);
          loadingToast = toast.loading('Importing sales data...', { id: loadingToast });
      }

      const response = await api.post('/sales/upload', { orders: validation.valid, isHistorical });
      if (response.data.success) {
        toast.success(response.data.message, { id: loadingToast });
        
        const skippedDetails = response.data.skippedDetails || [];
        const missing = skippedDetails.filter(s => s.reason === 'Product not found');
        const oos = skippedDetails.filter(s => s.reason === 'Out of stock');
        
        if (missing.length > 0) {
           const uniqueMissing = [];
           const seen = new Set();
           missing.forEach(m => {
              if (!seen.has(m.productName)) {
                 seen.add(m.productName);
                 uniqueMissing.push({
                     name: m.productName,
                     sku: '',
                     baseCost: '',
                     currentPrice: m.salePrice || '',
                     stockLevel: '',
                     category: '',
                     description: ''
                 });
              }
           });
           setMissingProducts(uniqueMissing);
           setCurrentMissingIndex(0);
           setMappingState('wizard');
           return;
        }
        
        if (oos.length > 0) {
           setOutOfStockWarnings(oos);
           setMappingState('done_with_warnings');
           return;
        }

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import sales data', { id: loadingToast });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
      
      <div className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover/50">
          <div>
            <h2 className="text-xl font-bold text-text-primary" id="modal-title">Import Sales Data</h2>
            <p className="text-sm text-text-secondary mt-1">Upload a CSV or Excel file. Our AI will automatically map the columns.</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mappingState === 'idle' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-surface-hover/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <FiUpload className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary">Click to upload CSV or Excel</p>
                <p className="text-xs text-text-secondary mt-1">Any tabular format is supported.</p>
                <input type="file" accept=".csv,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              </div>
              
              <div className="bg-surface-hover/50 border border-border rounded-xl p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-surface"
                          checked={isHistorical}
                          onChange={(e) => setIsHistorical(e.target.checked)}
                      />
                      <div>
                          <p className="text-sm font-semibold text-text-primary">Importing Historical Data?</p>
                          <p className="text-xs text-text-secondary mt-1">Enable this if you are importing old sales data. When enabled, this import will <strong className="text-primary">NOT</strong> deduct from your current product stock levels.</p>
                      </div>
                  </label>
              </div>
              
              <div className="bg-surface-hover/30 border border-border rounded-xl p-5 text-sm text-text-secondary space-y-4">
                  <div>
                      <h4 className="font-semibold text-text-primary mb-1">Recommended Format</h4>
                      <p>For best results, include columns for: <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">productName</code>, <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">orderId</code>, <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">quantity</code>, <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">salePrice</code>, and <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">purchasedAt</code>.</p>
                  </div>
                  <div>
                      <h4 className="font-semibold text-text-primary mb-2">Need to clean messy data?</h4>
                      <p className="mb-2">Copy this prompt and paste it into ChatGPT, Claude, or Gemini along with your messy data:</p>
                      <div className="bg-surface border border-border rounded-lg p-3">
                          <code className="text-xs text-text-primary/90 block whitespace-pre-wrap">
                              Please format my sales data into a clean CSV with the following columns: productName, orderId, quantity, salePrice, purchasedAt.{"\n\n"}
                              IMPORTANT: If any crucial information is missing (like sales volume, price, or product identifier), DO NOT guess. Instead, give me a clear ERROR MESSAGE telling me exactly which fields are missing for which rows so I can fix them.
                          </code>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {mappingState === 'mapping' && (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-text-primary">AI is analyzing columns and validating data...</p>
            </div>
          )}

          {mappingState === 'mapping_done' && validation && (
             <div className="space-y-6">
                <div className="p-4 bg-surface-hover rounded-xl border border-border flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <FiFileText className="w-6 h-6 text-primary" />
                       <div>
                           <p className="font-semibold text-text-primary">File Analyzed</p>
                           <p className="text-xs text-text-secondary">AI successfully mapped columns.</p>
                       </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <FiCheckCircle className="w-4 h-4" />
                            <h4 className="font-semibold text-sm">Valid Rows</h4>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{validation.valid.length}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${validation.invalid.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-surface-hover border-border'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${validation.invalid.length > 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                            <FiAlertCircle className="w-4 h-4" />
                            <h4 className="font-semibold text-sm">Rows with Errors</h4>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{validation.invalid.length}</p>
                    </div>
                </div>

                {validation.invalid.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-400">
                            <strong>Note:</strong> We found errors in {validation.invalid.length} rows (e.g. missing price or invalid numbers). You can proceed to import only the valid rows, or cancel to fix your file.
                        </p>
                    </div>
                )}
             </div>
          )}

          {mappingState === 'wizard' && (
             <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                    <h3 className="text-amber-500 font-semibold flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><FiAlertCircle /> Missing Products Found</span>
                        <span className="text-xs font-bold bg-amber-500/20 px-2 py-1 rounded-full">Product {currentMissingIndex + 1} of {missingProducts.length}</span>
                    </h3>
                    <p className="text-sm text-amber-500/80 mt-1">
                        We couldn't find the following products in your PricePilot database. Please fill in their details below.
                    </p>
                </div>
                
                {missingProducts.length > 0 && (
                <div className="border border-border rounded-xl p-5 space-y-4 bg-surface-hover/30">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Product Name</label>
                        <input type="text" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary" readOnly value={missingProducts[currentMissingIndex].name} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">SKU <span className="text-red-400">*</span></label>
                            <input type="text" className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg px-3 py-2 text-text-primary" 
                                value={missingProducts[currentMissingIndex].sku} 
                                onChange={e => {
                                    const newArr = [...missingProducts];
                                    newArr[currentMissingIndex].sku = e.target.value;
                                    setMissingProducts(newArr);
                                }} 
                                placeholder="Enter SKU"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
                            <input type="text" className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg px-3 py-2 text-text-primary" 
                                value={missingProducts[currentMissingIndex].category} 
                                onChange={e => {
                                    const newArr = [...missingProducts];
                                    newArr[currentMissingIndex].category = e.target.value;
                                    setMissingProducts(newArr);
                                }} 
                                placeholder="e.g. Electronics"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Base Cost ($) <span className="text-red-400">*</span></label>
                            <input type="number" step="0.01" className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg px-3 py-2 text-text-primary" 
                                value={missingProducts[currentMissingIndex].baseCost} 
                                onChange={e => {
                                    const newArr = [...missingProducts];
                                    newArr[currentMissingIndex].baseCost = e.target.value;
                                    setMissingProducts(newArr);
                                }} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Sale Price ($) <span className="text-red-400">*</span></label>
                            <input type="number" step="0.01" className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg px-3 py-2 text-text-primary" 
                                value={missingProducts[currentMissingIndex].currentPrice} 
                                onChange={e => {
                                    const newArr = [...missingProducts];
                                    newArr[currentMissingIndex].currentPrice = e.target.value;
                                    setMissingProducts(newArr);
                                }} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Initial Stock <span className="text-red-400">*</span></label>
                            <input type="number" className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg px-3 py-2 text-text-primary" 
                                value={missingProducts[currentMissingIndex].stockLevel} 
                                onChange={e => {
                                    const newArr = [...missingProducts];
                                    newArr[currentMissingIndex].stockLevel = e.target.value;
                                    setMissingProducts(newArr);
                                }} 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Description (Optional)</label>
                        <textarea className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg px-3 py-2 text-text-primary h-20 resize-none" 
                            value={missingProducts[currentMissingIndex].description} 
                            onChange={e => {
                                const newArr = [...missingProducts];
                                newArr[currentMissingIndex].description = e.target.value;
                                setMissingProducts(newArr);
                            }} 
                            placeholder="Brief product description..."
                        />
                    </div>
                </div>
                )}
             </div>
          )}
          
          {mappingState === 'done_with_warnings' && (
             <div className="space-y-4">
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4 text-center">
                    <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h3 className="text-emerald-500 font-semibold text-lg">Sales Imported Successfully</h3>
                    <p className="text-sm text-emerald-500/80 mt-1">Most of your sales were imported without issues.</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-2">
                        <FiAlertCircle /> Out of Stock Skipped Rows ({outOfStockWarnings.length})
                    </h3>
                    <p className="text-sm text-red-400/80 mb-3">
                        The following sales were skipped because the products do not have enough inventory on record. Please update your stock levels on the Products page and re-import these rows, or check "Historical Data".
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {outOfStockWarnings.map((w, i) => (
                            <div key={i} className="text-xs bg-red-500/5 p-2 rounded border border-red-500/10 flex justify-between">
                                <span className="font-medium text-red-300">{w.productName}</span>
                                <span className="text-red-400/70">Stock: {w.currentStock} | Required: {w.requestedQuantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={importing} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors">
            Cancel
          </button>
          
          {mappingState === 'mapping_done' && (
              <button 
                  type="button" 
                  onClick={() => handleImport()} 
                  disabled={importing || validation?.valid.length === 0} 
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                  {importing ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                  ) : (
                      <>Import Valid Rows Only</>
                  )}
              </button>
          )}
          
          {mappingState === 'wizard' && (
              <button 
                  type="button" 
                  onClick={() => {
                      const current = missingProducts[currentMissingIndex];
                      if (!current.sku || current.baseCost === '' || current.currentPrice === '' || current.stockLevel === '') {
                          toast.error('Please fill in all required fields (SKU, Cost, Price, Stock).');
                          return;
                      }
                      
                      if (currentMissingIndex < missingProducts.length - 1) {
                          setCurrentMissingIndex(prev => prev + 1);
                      } else {
                          // Submit all
                          const cleanProducts = missingProducts.map(p => ({
                              ...p,
                              baseCost: parseFloat(p.baseCost),
                              currentPrice: parseFloat(p.currentPrice),
                              stockLevel: parseInt(p.stockLevel)
                          }));
                          handleImport(cleanProducts);
                      }
                  }} 
                  disabled={importing} 
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                  {importing ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : currentMissingIndex < missingProducts.length - 1 ? (
                      <>Next Product</>
                  ) : (
                      <>Create All & Resume Import</>
                  )}
              </button>
          )}

          {mappingState === 'done_with_warnings' && (
              <button 
                  type="button" 
                  onClick={() => {
                      if (onSuccess) onSuccess();
                      onClose();
                  }} 
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
              >
                  Acknowledge & Close
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
