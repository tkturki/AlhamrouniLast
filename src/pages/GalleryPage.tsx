import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const GalleryPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from('items').select('*');
      setItems(data || []);
    };
    fetchItems();
  }, []);

  return (
    <div className="p-4 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500 border-b pb-2">معرض صور المجوهرات</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-yellow-600/30">
            <img 
              src={item.image_url || '/logo.png'} 
              alt={item.name} 
              className="w-full h-48 object-cover"
            />
            <div className="p-3">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <div className="flex justify-between mt-2 text-sm text-gray-300">
                <span>الوزن: {item.weight}غ</span>
                <span>العيار: {item.karat}</span>
              </div>
              <p className="mt-2 text-yellow-500 font-bold text-center border-t border-gray-700 pt-2">
                السعر: {item.price} د.ل
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
