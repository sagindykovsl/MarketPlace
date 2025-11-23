import React, { useState } from 'react';
import { MOCK_COMPLAINTS } from '../../services/mockData';
import { ComplaintStatus } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { AlertCircle, ArrowUpRight, CheckCircle, Wand2 } from 'lucide-react';
import { rewriteComplaintText } from '../../services/geminiService';

export const Complaints = () => {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  
  // State for the "Create Complaint" modal (Sales rep might simulate this or test it)
  // For the purpose of the demo, we'll focus on the Management aspect, 
  // but include a "AI Enhance" button to demonstrate the Gemini Requirement.
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhanceResponse = async () => {
    if (!replyText) return;
    setIsEnhancing(true);
    const enhanced = await rewriteComplaintText(replyText);
    setReplyText(enhanced);
    setIsEnhancing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
        <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">{t('nav.complaints')}</h2>
        </div>
        <div>
            {complaints.map(complaint => (
                <div 
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedComplaint === complaint.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            complaint.status === ComplaintStatus.OPEN ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {complaint.status}
                        </span>
                        <span className="text-xs text-gray-400">{complaint.createdAt}</span>
                    </div>
                    <p className="font-medium text-gray-900 line-clamp-2">{complaint.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Order: {complaint.orderId}</p>
                </div>
            ))}
        </div>
      </div>

      {/* Detail / Action */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
        {selectedComplaint ? (
            <>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resolution Console</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 italic">"{complaints.find(c => c.id === selectedComplaint)?.description}"</p>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Draft Response</label>
                    <div className="relative">
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Type your response to the consumer..."
                        />
                        <button 
                            onClick={handleEnhanceResponse}
                            disabled={isEnhancing || !replyText}
                            className="absolute bottom-2 right-2 flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                        >
                           <Wand2 size={14} /> 
                           {isEnhancing ? 'Improving...' : t('complaint.ai')}
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex gap-4 border-t border-gray-100 pt-6">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-orange-500 text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors">
                        <ArrowUpRight size={18} /> {t('action.escalate')}
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">
                        <CheckCircle size={18} /> {t('action.resolve')}
                    </button>
                </div>
            </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <AlertCircle size={48} className="mb-4 text-gray-300" />
                <p>Select a complaint to view details</p>
            </div>
        )}
      </div>
    </div>
  );
};