import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiUpload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../api';

export default function BulkSalesImportModal({ onClose, onSuccess }) {
  const [fileContent, setFileContent] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [mappingState, setMappingState] = useState('idle'); // idle | mapping | mapping_done
  const [validation, setValidation] = useState(null); // { valid: [], invalid: [] }
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

  const handleImport = async () => {
    if (!validation || validation.valid.length === 0) return;
    
    setImporting(true);
    const loadingToast = toast.loading('Importing sales data...');
    try {
      const response = await api.post('/sales/upload', { orders: validation.valid });
      if (response.data.success) {
        toast.success(response.data.message, { id: loadingToast });
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
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={importing} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors">
            Cancel
          </button>
          
          {mappingState === 'mapping_done' && (
              <button 
                  type="button" 
                  onClick={handleImport} 
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
        </div>
      </div>
    </div>
  );
}
