import React, { useState, useEffect, useRef } from 'react';
import { useAppAuth } from '../hooks/useAppAuth';
import { chatAPI, productAPI } from '../services/api';
import { Send, RefreshCw, ShoppingBag, ShieldCheck, UserCheck, Camera } from 'lucide-react';

export default function ChatWindow({ productId, otherUserId, productInfo, otherUserInfo, onMessageSent = null }) {
  const { user } = useAppAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [product, setProduct] = useState(productInfo);
  const [markingSold, setMarkingSold] = useState(false);

  const messagesEndRef = useRef(null);

  const loadMessages = async () => {
    if (!productId || !otherUserId) return;
    setLoading(true);
    try {
      const response = await chatAPI.getChatMessages(productId, otherUserId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // Auto-refresh chat every 8 seconds for pseudo-realtime experience
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [productId, otherUserId]);

  useEffect(() => {
    // Scroll to bottom of message list whenever messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage({
        productId,
        receiverId: otherUserId,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!window.confirm(`Are you sure you want to mark "${product.name}" as sold to ${otherUserInfo.name}?`)) {
      return;
    }

    setMarkingSold(true);
    try {
      await productAPI.markAsSold(productId, otherUserInfo.email);
      setProduct((prev) => ({ ...prev, isSold: true }));
      alert(`Successfully marked as sold! "${product.name}" has been logged in ${otherUserInfo.name}'s purchases.`);
      // Send automated message indicating product is sold
      await chatAPI.sendMessage({
        productId,
        receiverId: otherUserId,
        content: `🎉 Deal Closed! This item has been marked as Sold/Exchanged.`,
      });
      loadMessages();
    } catch (error) {
      console.error('Failed to mark item as sold:', error);
      alert('Error updating product status.');
    } finally {
      setMarkingSold(false);
    }
  };

  const isSeller = product && user && product.seller === user._id;

  return (
    <div className="flex flex-col h-[550px] bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
      
      {/* Header Info */}
      <div className="p-4 bg-dark-950 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-400">
            {otherUserInfo.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">{otherUserInfo.name}</h4>
            <p className="text-[10px] text-dark-400">
              {otherUserInfo.department || 'Student'} • {otherUserInfo.year || 'College'}
            </p>
          </div>
        </div>

        <button
          onClick={loadMessages}
          className="p-2 text-dark-450 hover:text-white rounded-xl hover:bg-dark-900 transition-colors"
          title="Refresh chat history"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Product Summary Panel */}
      {product && (
        <div className="p-3 bg-dark-900/60 border-b border-dark-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover border border-dark-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-dark-500 border border-dark-750">
                <Camera className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-semibold text-white line-clamp-1">{product.name}</p>
              <p className="text-[11px] font-bold text-brand-400">₹{product.price}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product.isSold ? (
              <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border border-green-500/25">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sold
              </span>
            ) : isSeller ? (
              <button
                onClick={handleMarkAsSold}
                disabled={markingSold}
                className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Mark Sold to Buyer
              </button>
            ) : (
              <span className="bg-brand-500/10 text-brand-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border border-brand-500/20">
                Available
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-dark-900/40">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm font-semibold text-dark-400">No messages yet.</p>
            <p className="text-xs text-dark-500 mt-1">Start the conversation by typing a message below!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user._id || msg.sender === user._id;
            return (
              <div
                key={msg._id}
                className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`py-2.5 px-4 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-dark-800 text-dark-100 rounded-tl-none border border-dark-750'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-dark-500 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Input Panel */}
      <form onSubmit={handleSendMessage} className="p-3 bg-dark-950 border-t border-dark-800 flex gap-2">
        <input
          type="text"
          placeholder={product?.isSold ? "This item is sold, but you can still chat..." : "Type your message..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-dark-900 border border-dark-800/80 focus:border-brand-500 focus:outline-none rounded-xl py-2.5 px-4 text-white text-sm transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-dark-800 disabled:text-dark-500 text-white rounded-xl transition-all shadow-md shadow-brand-600/10"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
