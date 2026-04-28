import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Image as ImageIcon, Film, FileText, Sparkles, X, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { usePosts } from '../context/PostContext';
import ImageCropModal from '../components/ImageCropModal';

const CreatePost = () => {
    const { createPost } = usePosts();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [docFile, setDocFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [cropConfig, setCropConfig] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const MotionDiv = motion.div;

    useEffect(() => () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setCropConfig({
                file,
                title: 'Crop post image',
                aspect: 16 / 9,
                fit: 'contain',
                outputWidth: 1280,
                initialZoom: 1,
            });
        }
        e.target.value = '';
    };

    const applySelectedImage = (file) => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setCropConfig(null);
    };

    const handleFileClear = (type) => {
        if (type === 'image') {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(null);
            setImagePreview(null);
        }
        if (type === 'video') setVideoFile(null);
        if (type === 'doc') setDocFile(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!content.trim() && !imageFile && !videoFile && !docFile) {
            toast.warn('Post cannot be empty');
            return;
        }

        const formData = new FormData();
        formData.append('text', content);
        if (imageFile) formData.append('image', imageFile);
        if (videoFile) formData.append('video', videoFile);
        if (docFile) formData.append('document', docFile);

        setIsSubmitting(true);
        try {
            const result = await createPost(formData);
            
            if (result && result.success) {
                // Success is handled in PostContext with a toast
                navigate('/');
            }
        } catch (error) {
            console.error('Post creation error:', error);
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {cropConfig && (
                <ImageCropModal
                    config={cropConfig}
                    onCancel={() => setCropConfig(null)}
                    onComplete={applySelectedImage}
                />
            )}
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="glass-card rounded-[40px] shadow-2xl p-8 sm:p-12 relative overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-button/20 rounded-full blur-3xl pointer-events-none" />

                <div className="mb-12 text-center md:text-left relative z-10">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-button rounded-2xl flex items-center justify-center text-ink shadow-xl shadow-button/20">
                            <Plus size={24} strokeWidth={3} />
                        </div>
                        <h1 className="text-4xl font-black text-ink tracking-tight">Create Post</h1>
                    </div>
                    <p className="text-ink/60 font-bold uppercase tracking-[0.2em] text-xs px-1">Share knowledge, moments, or resources with UniLink community</p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    <div className="relative group">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's happening on campus?..."
                            className="w-full p-8 bg-surface text-ink border border-accent/60 focus:border-accent rounded-[32px] outline-none transition-all text-xl font-medium placeholder:text-ink/50 resize-none min-h-[220px] shadow-inner"
                        />
                        
                        {/* Word count or something similar could go here */}
                        <div className="absolute bottom-6 right-8 text-ink/40 font-black text-xs uppercase tracking-widest">
                            {content.length} characters
                        </div>
                    </div>

                    <AnimatePresence>
                        {(imagePreview || videoFile || docFile) && (
                            <MotionDiv
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                {imagePreview && (
                                    <div className="relative group/preview rounded-[24px] overflow-hidden border-2 border-zinc-100 shadow-lg aspect-video max-h-64 mx-auto">
                                        <img src={imagePreview} className="w-full h-full object-contain bg-surface transition-transform group-hover/preview:scale-105 duration-700" alt="Preview" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setCropConfig({
                                                    file: imageFile,
                                                    title: 'Re-crop post image',
                                                    aspect: 16 / 9,
                                                    fit: 'contain',
                                                    outputWidth: 1280,
                                                    initialZoom: 1,
                                                })}
                                                className="px-4 py-2 bg-white text-ink rounded-full shadow-2xl hover:bg-panel transition-all transform hover:scale-105 active:scale-95 text-xs font-black uppercase tracking-widest"
                                            >
                                                Crop
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleFileClear('image')} 
                                                className="p-4 bg-secondary text-red-500 rounded-full shadow-2xl hover:bg-red-500 hover:text-primary transition-all transform hover:scale-110 active:scale-95"
                                            >
                                                <X size={24} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {videoFile && (
                                        <div className="flex items-center gap-3 bg-secondary text-primary px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl">
                                            <Film size={18} className="text-button" />
                                            <span className="truncate max-w-[150px]">{videoFile.name}</span>
                                            <button type="button" onClick={() => handleFileClear('video')} className="hover:text-red-400 p-1">
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                    {docFile && (
                                        <div className="flex items-center gap-3 bg-surface border border-accent/20 px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg text-ink">
                                            <FileText size={18} className="text-accent" />
                                            <span className="truncate max-w-[150px]">{docFile.name}</span>
                                            <button type="button" onClick={() => handleFileClear('doc')} className="hover:text-red-500 p-1">
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </MotionDiv>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-10 border-t border-accent/15">
                        <div className="flex items-center gap-3 bg-surface p-2 rounded-3xl border border-accent/20">
                            {[
                                { icon: ImageIcon, type: 'image', accept: 'image/*', color: 'text-accent bg-accent/10' },
                                { icon: Film, type: 'video', accept: 'video/*', color: 'text-accent bg-accent/10' },
                                { icon: FileText, type: 'doc', accept: '.pdf,.doc,.docx', color: 'text-accent bg-accent/10' }
                            ].map((btn) => (
                                <label key={btn.type} className={`cursor-pointer p-4 rounded-2xl ${btn.color} hover:scale-110 active:scale-95 transition-all shadow-sm border border-accent/20`}>
                                    <btn.icon size={24} strokeWidth={2.5} />
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept={btn.accept} 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (btn.type === 'image') handleImageChange(e);
                                            else if (btn.type === 'video') setVideoFile(file);
                                            else setDocFile(file);
                                        }} 
                                    />
                                </label>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || (!content.trim() && !imageFile && !videoFile && !docFile)}
                            className="btn-primary w-full sm:w-auto min-w-[240px] h-16 px-10 font-black uppercase tracking-[0.1em] shadow-2xl shadow-button/20 hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-4"
                        >
                            {isSubmitting ? (
                                <RefreshCw size={22} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={22} strokeWidth={2.5} />
                                    Post to Feed
                                </>
                            )}
                        </button>
                    </div>

                    {/* Pro Tips / Info */}
                    <div className="flex items-center gap-3 text-ink/70 bg-surface p-4 rounded-2xl border border-dashed border-accent/30">
                        <AlertCircle size={18} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Only academic or helpful campus content is encouraged.</p>
                    </div>
                </form>
                </div>
            </div>
        </>
    );
};

export default CreatePost;
