import { useState } from 'react';
import { bulkImportProducts } from '../api';
import toast from 'react-hot-toast';
import { FiX, FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiDownload } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';

export default function BulkImportModal({ onClose, onSuccess }) {
  const { formatCurrency, config } = useCurrency();
  const [fileContent, setFileContent] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const sampleCSV = `name,sku,category,baseCost,currentPrice,stockLevel,reorderThreshold
Wireless Earbuds Pro,WEB-PRO-01,Electronics,1200,2499,50,15
Smart Fitness Watch V2,SFW-V2-02,Fitness,1800,3499,35,10
Stainless Water Bottle 1L,SWB-1L-03,General,300,799,100,20`;

  const parseCSV = (csvText) => {
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
      return rows;
    } catch {
      return [];
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setFileContent(text);
      const parsed = parseCSV(text);
      setParsedData(parsed);
      toast.success(`Parsed ${parsed.length} rows from file`);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text) => {
    setFileContent(text);
    const parsed = parseCSV(text);
    setParsedData(parsed);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No valid products to import');
      return;
    }

    setImporting(true);
    try {
      const res = await bulkImportProducts(parsedData);
      setResults(res.data);
      toast.success(`Successfully imported ${res.data.importedCount} products!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const loadSample = () => {
    handleTextChange(sampleCSV);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FiUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Bulk Product Import</h2>
              <p className="text-xs text-text-secondary">Upload CSV/Excel or paste formatted text to add multiple products at once</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-border hover:bg-surface text-text-secondary hover:text-text-primary transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {results ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <FiCheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-400 text-sm">Import Finished</h4>
                  <p className="text-xs text-text-secondary">
                    {results.importedCount} products added successfully. {results.errorCount} skipped due to duplicates or formatting errors.
                  </p>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                    <FiAlertCircle className="w-4 h-4" /> Skipped Rows ({results.errors.length})
                  </h5>
                  <ul className="space-y-1 text-xs text-text-secondary max-h-36 overflow-y-auto">
                    {results.errors.map((err, idx) => (
                      <li key={idx} className="flex justify-between border-b border-border/40 py-1">
                        <span>Row {err.row} (SKU: <code>{err.sku}</code>)</span>
                        <span className="text-danger">{err.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="btn-primary text-xs px-5 py-2">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Upload Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-surface/40 hover:bg-surface transition group text-center">
                  <FiUpload className="w-8 h-8 text-text-secondary group-hover:text-primary mb-2 transition" />
                  <span className="text-sm font-semibold text-text-primary">Choose CSV / Text File</span>
                  <span className="text-xs text-text-secondary mt-1">.csv, .txt, .json supported</span>
                  <input type="file" accept=".csv,.txt,.json" onChange={handleFileUpload} className="hidden" />
                </label>

                <div className="border border-border rounded-xl p-4 bg-surface/40 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Quick Sample Data</span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Required headers: <code>name, sku, baseCost, currentPrice</code>. Optional: <code>category, stockLevel, reorderThreshold</code>.
                    </p>
                  </div>
                  <button onClick={loadSample} className="btn-secondary text-xs flex items-center gap-2 mt-3 w-max">
                    <FiDownload className="w-3.5 h-3.5" /> Load Sample CSV Template
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">CSV Raw Text Input</label>
                  <span className="text-xs text-primary font-semibold">{parsedData.length} Valid Rows Parsed</span>
                </div>
                <textarea
                  value={fileContent}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Paste CSV text here..."
                  rows={6}
                  className="w-full bg-surface border border-border text-text-primary rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-primary"
                />
              </div>

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-surface-header border-b border-border text-xs font-bold text-text-secondary uppercase">
                    Import Preview ({parsedData.length} items)
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-text-secondary bg-surface/80">
                          <th className="p-2">Name</th>
                          <th className="p-2">SKU</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right font-medium">Cost ({config.symbol})</th>
                          <th className="p-2 text-right font-medium">Price ({config.symbol})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium text-text-primary">{row.name}</td>
                            <td className="p-2 text-text-secondary font-mono">{row.sku}</td>
                            <td className="p-2 text-text-secondary">{row.category || 'General'}</td>
                            <td className="p-2 text-right">{formatCurrency(row.baseCost)}</td>
                            <td className="p-2 text-right font-bold text-primary">{formatCurrency(row.currentPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-text-secondary">All imported products will generate initial demand signals automatically.</span>
                <div className="flex gap-3">
                  <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || parsedData.length === 0}
                    className="btn-primary text-xs px-6 py-2 disabled:opacity-50"
                  >
                    {importing ? 'Importing...' : `Import ${parsedData.length} Products`}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
