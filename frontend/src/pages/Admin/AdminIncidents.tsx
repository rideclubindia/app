import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, Filter, Mail, Bookmark, MapPin, ChevronDown, Camera, X, Globe, Check, Users, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIncidentCategories, incidentIconMap } from '../../hooks/useIncidentCategories';
import { SearchInput } from '../../components/ui/SearchInput';
import { renderToString } from 'react-dom/server';
import { useToast } from '../../components/ToastContext';

const AdminIncidents = () => {
    const { showToast } = useToast();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'group'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'hidden'>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'hidden', label: 'Hidden' }
  ];
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [pinImages, setPinImages] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [tempLocation, setTempLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupForReport, setSelectedGroupForReport] = useState<string | null>(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const newMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { categories } = useIncidentCategories();

  useEffect(() => {
    const fetchIncidents = async () => {
      const { data } = await supabase.from('pins').select('*, confirmations(is_false)').order('created_at', { ascending: false });
      if (data) {
        // Compute confirmations and rejections
        const enhancedData = data.map((pin: any) => {
          let confirms = 0;
          let rejects = 0;
          if (pin.confirmations) {
            pin.confirmations.forEach((c: any) => {
              if (c.is_false) rejects++;
              else confirms++;
            });
          }
          
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const pinDate = new Date(pin.created_at);
          let displayStatus = pin.status || 'active';
          if (displayStatus === 'active' && pinDate < twoHoursAgo) {
            displayStatus = 'expired';
          }
          
          return { ...pin, confirms, rejects, displayStatus };
        });
        setIncidents(enhancedData);
      }
    };
    fetchIncidents();
    
    const channel = supabase.channel('admin_incidents_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, fetchIncidents)
      .subscribe();
      
    return () => { channel.unsubscribe(); };
  }, []);

  const handleSelectPin = async (pin: any) => {
    setSelectedPin(pin);
    setIsEditing(false);
    setIsAdding(false);
    setTempLocation(null);
    if (newMarkerRef.current) newMarkerRef.current.remove();
    newMarkerRef.current = null;
    map.current?.flyTo({ center: [pin.longitude, pin.latitude], zoom: 16 });
    // Fetch related images
    const { data } = await supabase.from('pin_images').select('*').eq('pin_id', pin.id);
    setPinImages(data || []);
  };

  const handleConfirmLocation = () => {
    if (!tempLocation) return;
    setSelectedPin(null);
    setIsEditing(false);
    setIsAdding(true);
    setFormData({ category: categories[0]?.id || '', description: '', severity: 3, latitude: tempLocation.latitude, longitude: tempLocation.longitude });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    try {
      if (isAdding) {
        if (!formData.latitude || !formData.longitude) {
          showToast('Please click on the map to set a location', 'info');
          setIsSubmitting(false);
          return;
        }

        let photoUrl = null;
        if (selectedFiles.length > 0) {
          const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
          const invalidFile = selectedFiles.find(f => !f.type.startsWith('image/') || f.size > MAX_FILE_SIZE);
          if (invalidFile) {
            showToast(
              !invalidFile.type.startsWith('image/')
                ? `"${invalidFile.name}" is not an image file.`
                : `"${invalidFile.name}" exceeds the 10MB size limit.`,
              'error'
            );
            setIsSubmitting(false);
            return;
          }

          const urls = [];
          for (const file of selectedFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('incident-photos').upload(fileName, file);
            if (!uploadError) {
              const { data } = supabase.storage.from('incident-photos').getPublicUrl(fileName);
              urls.push(data.publicUrl);
            } else {
              showToast(`Failed to upload "${file.name}".`, 'error');
            }
          }
          if (urls.length > 0) {
            photoUrl = urls.join(',');
          }
        }

        const finalCategory = formData.category === 'Other' && customCategory.trim() !== '' 
          ? `Other: ${customCategory.trim()}` 
          : formData.category;

        const { error } = await supabase.from('pins').insert([{
          category: finalCategory,
          description: formData.description,
          severity: formData.category === 'Accident' ? 3 : 1,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: 'active',
          photo_url: photoUrl,
          group_id: selectedGroupForReport,
          reporter_name: 'Admin'
        }]);

        if (error) {
          console.error("Insert error:", error);
          showToast("Failed to create incident: " + error.message, 'error');
        } else {
          setIsAdding(false);
          setTempLocation(null);
          setSelectedFiles([]);
          setCustomCategory('');
          setSelectedGroupForReport(null);
          if (newMarkerRef.current) newMarkerRef.current.remove();
          newMarkerRef.current = null;
        }
      } else if (isEditing && selectedPin) {
        const { error } = await supabase.from('pins').update({
          category: formData.category,
          description: formData.description,
          severity: formData.severity,
          status: formData.status
        }).eq('id', selectedPin.id);
        if (!error) {
          setIsEditing(false);
          setSelectedPin({ ...selectedPin, ...formData });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: 'hide' | 'delete') => {
    if (!selectedPin) return;
    if (action === 'delete') {
      await supabase.from('pins').delete().eq('id', selectedPin.id);
    } else if (action === 'hide') {
      await supabase.from('pins').update({ status: 'hidden' }).eq('id', selectedPin.id);
    }
    setSelectedPin(null);
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [78.4867, 17.3850],
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setTempLocation({ latitude: lat, longitude: lng });
      setIsAdding(false);
      setSelectedPin(null);
      setIsEditing(false);

      const onConfirm = () => {
        setIsAdding(true);
        setFormData({ category: categories[0]?.id || '', description: '', severity: 1, latitude: lat, longitude: lng });
        if (newMarkerRef.current) {
          newMarkerRef.current.getPopup()?.remove();
        }
      };
      
      if (!newMarkerRef.current && map.current) {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-[#ef4523] rounded-full shadow-lg border-2 border-white flex items-center justify-center animate-bounce';
        
        const popupNode = document.createElement('div');
        popupNode.innerHTML = `
          <div class="flex flex-col items-center gap-1.5 p-0.5">
            <span class="text-[11px] font-bold text-[#273a5a]">New Incident?</span>
            <button id="confirm-btn" class="h-7 px-3 bg-[#ef4523] text-white rounded text-[11px] font-bold hover:bg-[#ef4523] transition-colors whitespace-nowrap shadow-sm">
              Confirm Location
            </button>
          </div>
        `;
        popupNode.querySelector('#confirm-btn')!.addEventListener('click', onConfirm);

        const popup = new maplibregl.Popup({ closeButton: false, offset: 15, className: 'custom-popup' }).setDOMContent(popupNode);

        newMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);
          
        newMarkerRef.current.togglePopup();
      } else if (newMarkerRef.current) {
        newMarkerRef.current.setLngLat([lng, lat]);
        // Remove old popup and create a fresh one with the updated handler
        newMarkerRef.current.getPopup()?.remove();
        const newPopupNode = document.createElement('div');
        newPopupNode.innerHTML = `
          <div class="flex flex-col items-center gap-1.5 p-0.5">
            <span class="text-[11px] font-bold text-[#273a5a]">New Incident?</span>
            <button id="confirm-btn" class="h-7 px-3 bg-[#ef4523] text-white rounded text-[11px] font-bold hover:bg-[#ef4523] transition-colors whitespace-nowrap shadow-sm">
              Confirm Location
            </button>
          </div>
        `;
        newPopupNode.querySelector('#confirm-btn')!.addEventListener('click', onConfirm);
        const newPopup = new maplibregl.Popup({ closeButton: false, offset: 15, className: 'custom-popup' }).setDOMContent(newPopupNode);
        newMarkerRef.current.setPopup(newPopup);
        
        if (!newMarkerRef.current.getPopup().isOpen()) {
          newMarkerRef.current.togglePopup();
        }
      }
      
      map.current?.flyTo({ center: [lng, lat], zoom: 15 });
    });
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    incidents.forEach(pin => {
      if (!pin.latitude || !pin.longitude) return;
      
      const cat = categories.find(c => c.id === pin.category);
      const IconComponent = cat ? incidentIconMap[cat.iconName] : incidentIconMap['MoreHorizontal'];
      const iconHtml = renderToString(<IconComponent className="w-3.5 h-3.5" />);
      
      const el = document.createElement('div');
      el.className = `w-6 h-6 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-2 border-white cursor-pointer ${cat?.bg || 'bg-gray-100'} ${cat?.color || 'text-gray-600'}`;
      el.innerHTML = iconHtml;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectPin(pin);
      });
      
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div style="padding:4px;font-family:sans-serif;">
            <strong style="font-size:12px;display:block;margin-bottom:2px;">${pin.category}</strong>
            <span style="font-size:10px;color:#34C759;">${pin.confirms || 0} Confirms</span> | 
            <span style="font-size:10px;color:#FF3B30;">${pin.rejects || 0} Rejects</span>
          </div>
        `))
        .addTo(map.current!);
markersRef.current[pin.id] = marker;
    });
  }, [incidents, categories]);

  const filteredIncidents = incidents.filter(pin => {
    // Text search
    const matchesSearch = pin.category?.toLowerCase()?.includes(search.toLowerCase()) || 
                          pin.location_name?.toLowerCase()?.includes(search.toLowerCase()) ||
                          String(pin.id)?.toLowerCase()?.includes(search.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || pin.displayStatus === statusFilter;
    
    // Scope filter (public vs group)
    const matchesScope = filterType === 'all' || 
                         (filterType === 'public' && !pin.group_id) || 
                         (filterType === 'group' && !!pin.group_id);

    return matchesSearch && matchesStatus && matchesScope;
  });

  const liveCount = incidents.filter(p => p.displayStatus === 'active').length;

  return (
    <div className="flex w-full h-full bg-[#FFFFFF] text-[#273a5a]">
      
      {/* Left List Pane */}
      <div className="w-[30%] flex flex-col h-full bg-white relative z-10 border-r border-[#E5E5EA]">
        
        {/* Header */}
        <div className="px-6 pt-3 pb-4 border-b border-[#E5E5EA] shrink-0">
          <div className="flex flex-col gap-2 mb-2">
            {/* Quick Filters */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start">
              <button onClick={() => setFilterType('all')} className={`px-2 py-1 text-[10px] font-bold rounded ${filterType === 'all' ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500'}`}>All</button>
              <button onClick={() => setFilterType('public')} className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 ${filterType === 'public' ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500'}`}><Globe className="w-3 h-3"/> Public</button>
              <button onClick={() => setFilterType('group')} className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 ${filterType === 'group' ? 'bg-white shadow text-[#273a5a]' : 'text-gray-500'}`}><Users className="w-3 h-3"/> Groups</button>
            </div>

            <div>
              <h1 className="text-[18px] font-bold text-dark flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#ef4523]" />
                {liveCount} Active Incidents
              </h1>
              <p className="text-[12px] text-[#8A8A8E] mt-0.5">Overview and manage reports</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <SearchInput 
                variant="admin"
                placeholder="Search location or category..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="h-8 px-3 bg-white border border-[#E5E5EA] rounded text-[12px] font-semibold text-dark flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors w-32"
              >
                {statusOptions.find(o => o.value === statusFilter)?.label}
                <ChevronDown className={`w-3.5 h-3.5 text-[#8A8A8E] transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#E5E5EA] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-20 overflow-hidden py-1">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        className={`w-full text-left px-3 py-2 text-[12px] font-bold transition-colors ${statusFilter === opt.value ? 'text-[#ef4523] bg-[#FFF0E6]' : 'text-dark hover:bg-gray-50'}`}
                        onClick={() => {
                          setStatusFilter(opt.value as any);
                          setIsStatusDropdownOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#FFFFFF]">
          <div className="flex flex-col">
            {filteredIncidents.map(pin => {
              const cat = categories.find(c => c.id === pin.category);
              return (
                <div 
                  key={pin.id} 
                  onClick={() => handleSelectPin(pin)}
                  className={`bg-white border-b p-2 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer group ${selectedPin?.id === pin.id ? 'border-l-4 border-l-[#ef4523] bg-orange-50/30' : 'border-l-4 border-l-transparent border-b-[#E5E5EA]'}`}
                >
                  <div className={`w-[36px] h-[36px] rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden ${cat?.bg || 'bg-gray-100'}`}>
                    {(() => {
                      const IconComp = incidentIconMap[cat?.iconName as keyof typeof incidentIconMap] || MapPin;
                      return <IconComp className={`w-4 h-4 ${cat?.color || 'text-gray-500'}`} strokeWidth={2.5} />;
                    })()}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h3 className="text-[12px] font-bold leading-none pt-0.5">{pin.category.split(':')[0]}</h3>
                        <div className="flex items-center gap-1 text-[#8A8A8E] mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-medium truncate max-w-[130px]">{pin.location_name || `${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {pin.group_id && <span title="Group Incident"><Users className="w-2.5 h-2.5 text-[#ef4523]" /></span>}
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                          pin.displayStatus === 'hidden' ? 'bg-[#F2F4F7] text-[#8A8A8E]' : 
                          pin.displayStatus === 'expired' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-[#E5F9ED] text-[#34C759]'
                        }`}>
                          {pin.displayStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#8A8A8E]">
                        <span>{new Date(pin.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <div className="w-0.5 h-0.5 bg-[#E5E5EA] rounded-full"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#34C759] bg-[#E5F9ED] px-1.5 py-0.5 rounded">{pin.confirms || 0} Confirms</span>
                          {pin.rejects > 0 && <span className="text-[#FF3B30] bg-[#FFEBEE] px-1.5 py-0.5 rounded">{pin.rejects} Rejects</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Map Pane */}
      <div className="w-[70%] h-full relative bg-[#E5E5EA] overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Detail/Add Drawer overlay over Map */}
        <div className={`absolute top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-20 transform transition-transform duration-300 ease-in-out flex flex-col ${(selectedPin || isAdding) ? 'translate-x-0' : 'translate-x-full'}`}>
          {isAdding ? (
            <>
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-[18px] font-bold text-[#273a5a] leading-tight">Add New Incident</h2>
                  <p className="text-[11px] text-[#ef4523] mt-1 font-semibold">Location Confirmed</p>
                </div>
                <button onClick={() => { setIsAdding(false); setTempLocation(null); if (newMarkerRef.current) newMarkerRef.current.remove(); newMarkerRef.current = null; }} className="text-[#8A8A8E] hover:text-[#273a5a] bg-gray-50 rounded p-1">
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
                
                {/* Location Confirmed Text */}
                <div className="w-full bg-green-50 text-green-700 font-bold p-4 rounded-lg flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  Location Confirmed on Map
                </div>
                
                {/* Select Type Grid */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[16px] text-dark mb-4">Select Type</h3>
                  <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {categories.map((type) => {
                      const IconComp = incidentIconMap[type.iconName as keyof typeof incidentIconMap] || MapPin;
                      const isSelected = formData.category === type.id;
                      return (
                        <div key={type.id} onClick={() => setFormData({...formData, category: type.id})} className="flex flex-col items-center gap-2 cursor-pointer">
                          <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-lg ' + (type.bg || 'bg-gray-100') : (type.bg || 'bg-gray-100')}`}>
                            <IconComp className={`w-7 h-7 ${type.color || 'text-gray-600'}`} />
                          </div>
                          <span className={`text-[12px] font-semibold text-center leading-tight ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                            {type.id}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Custom Name (if Other) */}
                {formData.category === 'Other' && (
                  <div className="flex-shrink-0 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-[16px] text-dark mb-3">Custom Name</h3>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-gray-200 rounded-lg p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[15px]" 
                      placeholder="E.g., Pothole, Stray Animal..." 
                      value={customCategory} 
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </div>
                )}
                
                {/* Description Area */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[16px] text-dark mb-3">
                    Description <span className="text-gray-400 font-normal text-[14px]">(optional)</span>
                  </h3>
                  <div className="relative">
                    <textarea 
                      className="w-full bg-white border border-gray-200 rounded-lg p-4 pb-8 h-[120px] resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[15px]" 
                      placeholder="Tell others what's happening..." 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                    <span className="absolute bottom-3 right-4 text-[12px] text-gray-400 font-medium">{(formData.description || '').length}/200</span>
                  </div>
                </div>

                {/* Photo Area */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[16px] text-dark mb-3">
                    Add Photos ({selectedFiles.length}/3) <span className="text-gray-400 font-normal text-[14px]">(optional)</span>
                  </h3>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
                        const newFiles = Array.from(e.target.files);
                        const invalid = newFiles.find(f => !f.type.startsWith('image/') || f.size > MAX_FILE_SIZE);
                        if (invalid) {
                          showToast(
                            !invalid.type.startsWith('image/')
                              ? `"${invalid.name}" is not an image file.`
                              : `"${invalid.name}" exceeds the 10MB size limit.`,
                            'error'
                          );
                          return;
                        }
                        setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 3));
                      }
                    }}
                  />
                  
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative w-[100px] h-[100px] shrink-0 rounded-lg overflow-hidden border-2 border-primary">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute top-1 right-1 bg-[#273a5a]/50 p-1 rounded-full text-white hover:bg-[#273a5a]/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {selectedFiles.length < 3 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[100px] h-[100px] shrink-0 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Camera className="w-8 h-8" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Post To Selection */}
                <div className="flex-shrink-0 relative">
                  <h3 className="font-bold text-[16px] text-dark mb-3">Post To</h3>
                  <div 
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <span className="text-[15px] font-medium text-dark">
                      {selectedGroupForReport === null 
                        ? (userGroups.length > 0 ? "Public (Everyone)" : "Public (Join a group to post privately)") 
                        : `Group: ${userGroups.find(g => g.id === selectedGroupForReport)?.name || 'Unknown'}`
                      }
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {showGroupDropdown && (
                    <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div 
                        onClick={() => { setSelectedGroupForReport(null); setShowGroupDropdown(false); }}
                        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedGroupForReport === null ? 'bg-orange-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className={`w-5 h-5 ${selectedGroupForReport === null ? 'text-primary' : 'text-gray-400'}`} />
                          <div>
                            <p className={`font-bold text-[15px] ${selectedGroupForReport === null ? 'text-primary' : 'text-dark'}`}>Public (Everyone)</p>
                            <p className="text-[12px] text-gray-500">Anyone nearby can see this</p>
                          </div>
                        </div>
                        {selectedGroupForReport === null && <Check className="w-5 h-5 text-primary" />}
                      </div>

                      <div className="max-h-[200px] overflow-y-auto">
                        {userGroups.map(g => (
                          <div 
                            key={g.id}
                            onClick={() => { setSelectedGroupForReport(g.id); setShowGroupDropdown(false); }}
                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedGroupForReport === g.id ? 'bg-orange-50/50' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <Users className={`w-5 h-5 ${selectedGroupForReport === g.id ? 'text-primary' : 'text-gray-400'}`} />
                              <div>
                                <p className={`font-bold text-[15px] ${selectedGroupForReport === g.id ? 'text-primary' : 'text-dark'}`}>{g.name}</p>
                                <p className="text-[12px] text-gray-500">Only group members can see this</p>
                              </div>
                            </div>
                            {selectedGroupForReport === g.id && <Check className="w-5 h-5 text-primary" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
              <div className="w-full p-5 bg-white border-t border-gray-100 flex-shrink-0 mt-auto z-10">
                <button 
                  onClick={handleSave} 
                  disabled={isSubmitting}
                  className={`w-full h-[56px] text-white font-bold text-[16px] rounded-lg flex items-center justify-center transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#ef4523] shadow-[0_8px_20px_rgba(241,90,36,0.3)] active:scale-95'}`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          ) : isEditing && selectedPin ? (
            <>
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-[18px] font-bold text-[#273a5a] leading-tight">Edit Incident</h2>
                  <p className="text-[11px] text-[#8A8A8E] font-mono mt-1">ID: {selectedPin.id}</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="text-[#8A8A8E] hover:text-[#273a5a] bg-gray-50 rounded p-1">
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#8A8A8E] uppercase mb-1 block">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded p-2 text-sm bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8A8A8E] uppercase mb-1 block">Severity (1-3)</label>
                  <input type="number" min="1" max="3" value={formData.severity} onChange={e => setFormData({...formData, severity: parseInt(e.target.value)})} className="w-full border rounded p-2 text-sm bg-white" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8A8A8E] uppercase mb-1 block">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded p-2 text-sm bg-white">
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8A8A8E] uppercase mb-1 block">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full border rounded p-2 text-sm bg-white"></textarea>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8A8A8E] uppercase mb-1 block">Add Photo (Optional)</label>
                  <button className="w-full h-20 border-[2px] border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-[#ef4523] hover:border-[#ef4523] hover:bg-[#ef4523]/5 transition-all">
                    <span className="text-[24px] mb-1">📷</span>
                    <span className="text-[11px] font-medium">Upload</span>
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-[#E5E5EA] shrink-0">
                <button onClick={handleSave} className="w-full h-10 rounded bg-[#273a5a] text-white font-bold text-[12px] hover:bg-gray-800">
                  Save Changes
                </button>
              </div>
            </>
          ) : selectedPin ? (
            <>
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[18px] font-bold text-[#273a5a] leading-tight">{selectedPin.category}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedPin.displayStatus === 'hidden' ? 'bg-[#F2F4F7] text-[#8A8A8E]' : 
                      selectedPin.displayStatus === 'expired' ? 'bg-yellow-50 text-yellow-600' : 
                      'bg-[#E5F9ED] text-[#34C759]'
                    }`}>
                      {selectedPin.displayStatus}
                    </span>
                    {selectedPin.group_id && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-orange-100 text-[#ef4523] flex items-center gap-1"><Users className="w-3 h-3"/> Group</span>}
                  </div>
                  <p className="text-[11px] text-[#8A8A8E] font-mono">ID: {selectedPin.id}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setIsEditing(true); setFormData({ category: selectedPin.category, description: selectedPin.description, severity: selectedPin.severity, status: selectedPin.status }); }} className="text-[#ef4523] text-[11px] font-bold hover:underline">
                    Edit
                  </button>
                  <button onClick={() => setSelectedPin(null)} className="text-[#8A8A8E] hover:text-[#273a5a] bg-gray-50 rounded p-1">
                    &times;
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Creator */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3">Reported By</h3>
                  <div className="p-4 bg-gray-50 rounded mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-[#ef4523]">
                        {(selectedPin.reporter_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-[14px] text-dark">
                          {selectedPin.reporter_name || 'Anonymous User'}
                        </h4>
                        <p className="text-[11px] text-[#8A8A8E]">{new Date(selectedPin.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3">Incident Details</h3>
                  <div className="bg-[#F8F9FB] rounded-lg p-3 text-[12px] text-gray-700 whitespace-pre-wrap">
                    {selectedPin.description || 'No description provided.'}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-[#F8F9FB] rounded-lg p-3">
                      <div className="text-[10px] text-[#8A8A8E] mb-1">Confirmations</div>
                      <div className="font-bold text-[13px] text-[#34C759]">{selectedPin.confirms || 0} Users</div>
                    </div>
                    <div className="bg-[#F8F9FB] rounded-lg p-3">
                      <div className="text-[10px] text-[#8A8A8E] mb-1">Rejections (Fake Reports)</div>
                      <div className="font-bold text-[13px] text-[#FF3B30]">{selectedPin.rejects || 0} Users</div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3">Coordinates</h3>
                  <div className="flex items-center gap-2 bg-[#F8F9FB] rounded-lg p-3 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#ef4523]" />
                    {selectedPin.latitude.toFixed(6)}, {selectedPin.longitude.toFixed(6)}
                  </div>
                </div>

                {/* Images */}
                {selectedPin.photo_url && (
                  <div className="col-span-2 mt-4">
                    <p className="text-[11px] font-bold text-[#8A8A8E] uppercase mb-2">Attached Photos</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedPin.photo_url.split(',').map((url: string, idx: number) => (
                        <img key={idx} src={url.trim()} className="w-24 h-24 object-cover rounded-lg border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-[#E5E5EA] shrink-0 flex gap-3">
                <button 
                  onClick={() => handleAction('hide')}
                  disabled={selectedPin.status === 'hidden'}
                  className="flex-1 h-10 rounded bg-[#273a5a] text-white font-bold text-[12px] hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Mark as Hide
                </button>
                <button 
                  onClick={() => handleAction('delete')}
                  className="flex-1 h-10 rounded border border-[#FF3B30] text-[#FF3B30] font-bold text-[12px] hover:bg-[#FFF0F0] transition-colors"
                >
                  Delete Record
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

    </div>
  );
};

export default AdminIncidents;
