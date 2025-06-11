import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { whiskyAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DistillerySelector from '../../components/common/DistillerySelector';
import NewDistilleryModal from '../../components/common/NewDistilleryModal';
import SearchableCountrySelector from '../../components/common/SearchableCountrySelector';
import toast from 'react-hot-toast';

const WhiskyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [whisky, setWhisky] = useState(null);
  const [showNewDistilleryModal, setShowNewDistilleryModal] = useState(false);
  const [newDistilleryName, setNewDistilleryName] = useState('');
  const [selectedDistillery, setSelectedDistillery] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      distillery: '',
      distillery_id: null,
      region: '',
      country: '', // No default country - should be populated by distillery selection
      age: '',
      abv: '',
      type: 'single_malt',
      cask_type: '',
      description: '',
      tasting_notes: {
        color: '',
        nose: '',
        palate: '',
        finish: ''
      },
      purchase_date: '',
      purchase_price: '',
      current_price: '',
      quantity: 1,
      bottle_size: 700,
      image_url: '',
      is_available: true,
      is_featured: false
    }
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }

    if (isEdit) {
      loadWhisky();
    }
  }, [id, isAdmin, navigate]);

  const loadWhisky = async () => {
    try {
      setLoading(true);
      const response = await whiskyAPI.getById(id);
      const whiskyData = response.data.whisky;
      setWhisky(whiskyData);
      
      // Set form values
      Object.keys(whiskyData).forEach(key => {
        if (key === 'purchase_date' && whiskyData[key]) {
          setValue(key, new Date(whiskyData[key]).toISOString().split('T')[0]);
        } else if (key === 'tasting_notes' && whiskyData[key]) {
          Object.keys(whiskyData[key]).forEach(noteKey => {
            setValue(`tasting_notes.${noteKey}`, whiskyData[key][noteKey] || '');
          });
        } else {
          setValue(key, whiskyData[key] || '');
        }
      });

      // Set selected distillery if available
      if (whiskyData.distilleryInfo) {
        setSelectedDistillery(whiskyData.distilleryInfo);
      } else if (whiskyData.distillery) {
        // For backward compatibility, create a pseudo-distillery object
        setSelectedDistillery({
          name: whiskyData.distillery,
          id: whiskyData.distillery_id
        });
      }

      // Set selected country if available
      if (whiskyData.country) {
        setSelectedCountry({
          name: whiskyData.country,
          code: whiskyData.country === 'Scotland' ? 'SCT' : 
                whiskyData.country === 'United States' ? 'US' : 
                whiskyData.country === 'Ireland' ? 'IE' : 
                whiskyData.country === 'Japan' ? 'JP' : 'CUSTOM',
          flag: whiskyData.country === 'Scotland' ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿' : 
                whiskyData.country === 'United States' ? '🇺🇸' : 
                whiskyData.country === 'Ireland' ? '🇮🇪' : 
                whiskyData.country === 'Japan' ? '🇯🇵' : '🌍'
        });
      }
    } catch (error) {
      console.error('Error loading whisky:', error);
      toast.error('Failed to load whisky details');
      navigate('/admin/whiskies');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Clean up data
      const cleanData = {
        ...data,
        age: data.age ? parseInt(data.age) : null,
        abv: data.abv ? parseFloat(data.abv) : null,
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
        current_price: data.current_price ? parseFloat(data.current_price) : null,
        quantity: parseInt(data.quantity) || 1,
        bottle_size: parseInt(data.bottle_size) || 700,
        purchase_date: data.purchase_date || null,
        distillery_id: selectedDistillery?.id || null,
        // Properly handle boolean fields
        is_available: Boolean(data.is_available),
        is_featured: Boolean(data.is_featured),
      };

      if (isEdit) {
        await whiskyAPI.update(id, cleanData);
        toast.success('Whisky updated successfully!');
      } else {
        await whiskyAPI.create(cleanData);
        toast.success('Whisky created successfully!');
      }
      
      navigate('/whiskies');
    } catch (error) {
      console.error('Error saving whisky:', error);
      const message = error.response?.data?.message || 'Failed to save whisky';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDistilleryChange = (name, distilleryId, distillery) => {
    setValue('distillery', name);
    setValue('distillery_id', distilleryId);
    setSelectedDistillery(distillery);
    
    // Auto-populate region and country from distillery data (always override)
    if (distillery && typeof distillery === 'object') {
      if (distillery.region) {
        setValue('region', distillery.region);
      }
      
      if (distillery.country) {
        setValue('country', distillery.country);
        // Update selected country state for the SearchableCountrySelector
        // Use a more comprehensive mapping or find from countries data
        const countryMappings = {
          'Scotland': { code: 'SCT', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
          'United States': { code: 'US', flag: '🇺🇸' },
          'Ireland': { code: 'IE', flag: '🇮🇪' },
          'Japan': { code: 'JP', flag: '🇯🇵' },
          'Canada': { code: 'CA', flag: '🇨🇦' },
          'India': { code: 'IN', flag: '🇮🇳' },
          'Taiwan': { code: 'TW', flag: '🇹🇼' },
          'England': { code: 'EN', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
          'Wales': { code: 'WLS', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' }
        };
        
        const mapping = countryMappings[distillery.country] || { code: 'CUSTOM', flag: '🌍' };
        setSelectedCountry({
          name: distillery.country,
          code: mapping.code,
          flag: mapping.flag
        });
      }
    }
  };

  const handleNewDistilleryRequest = (name) => {
    setNewDistilleryName(name);
    setShowNewDistilleryModal(true);
  };

  const handleNewDistilleryCreated = (newDistillery) => {
    // Update form with the new distillery
    setValue('distillery', newDistillery.name);
    setValue('distillery_id', newDistillery.id);
    setSelectedDistillery(newDistillery);
    
    // Auto-populate region and country from newly created distillery (always override)
    if (newDistillery.region) {
      setValue('region', newDistillery.region);
    }
    
    if (newDistillery.country) {
      setValue('country', newDistillery.country);
      // Update selected country state for the SearchableCountrySelector
      const countryMappings = {
        'Scotland': { code: 'SCT', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
        'United States': { code: 'US', flag: '🇺🇸' },
        'Ireland': { code: 'IE', flag: '🇮🇪' },
        'Japan': { code: 'JP', flag: '🇯🇵' },
        'Canada': { code: 'CA', flag: '🇨🇦' },
        'India': { code: 'IN', flag: '🇮🇳' },
        'Taiwan': { code: 'TW', flag: '🇹🇼' },
        'England': { code: 'EN', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
        'Wales': { code: 'WLS', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' }
      };
      
      const mapping = countryMappings[newDistillery.country] || { code: 'CUSTOM', flag: '🌍' };
      setSelectedCountry({
        name: newDistillery.country,
        code: mapping.code,
        flag: mapping.flag
      });
    }
    
    toast.success(`Distillery "${newDistillery.name}" created and selected!`);
  };

  const handleCountryChange = (countryName, countryCode, country) => {
    setValue('country', countryName);
    setSelectedCountry(country);
  };

  if (!isAdmin()) {
    return null;
  }

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/whiskies')}
          className="text-amber-600 hover:text-amber-700 mb-4"
        >
          ← Back to Whiskies
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Whisky' : 'Add New Whisky'}
        </h1>
        <p className="text-gray-600">
          {isEdit ? 'Update whisky information' : 'Add a new whisky to the collection'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Whisky Name *
              </label>
              <input
                {...register('name', { required: 'Whisky name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Macallan 18 Year Old"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <DistillerySelector
                value={selectedDistillery || watch('distillery')}
                onChange={handleDistilleryChange}
                error={errors.distillery?.message}
                required={true}
                onNewDistilleryRequest={handleNewDistilleryRequest}
              />
              {/* Hidden field to register distillery value with react-hook-form */}
              <input
                {...register('distillery', { required: 'Distillery is required' })}
                type="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                {...register('region')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Speyside, Kentucky, Osaka"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the distillery's region or leave empty
              </p>
            </div>

            <div>
              <SearchableCountrySelector
                value={selectedCountry || watch('country')}
                onChange={handleCountryChange}
                error={errors.country?.message}
                placeholder="Select distillery first, or search country..."
              />
              {/* Hidden field to register country value with react-hook-form */}
              <input
                {...register('country')}
                type="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (years)
              </label>
              <input
                {...register('age', { 
                  min: { value: 0, message: 'Age cannot be negative' },
                  max: { value: 100, message: 'Age cannot exceed 100 years' }
                })}
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="Leave empty for NAS"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ABV (%)
              </label>
              <input
                {...register('abv', { 
                  min: { value: 0, message: 'ABV cannot be negative' },
                  max: { value: 100, message: 'ABV cannot exceed 100%' }
                })}
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., 43.0"
              />
              {errors.abv && (
                <p className="mt-1 text-sm text-red-600">{errors.abv.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="single_malt">Single Malt</option>
                <option value="blended_whisky">Blended Whisky</option>
                <option value="blended_malt">Blended Malt</option>
                <option value="grain_whisky">Grain Whisky</option>
                <option value="bourbon">Bourbon</option>
                <option value="rye">Rye</option>
                <option value="irish">Irish</option>
                <option value="japanese">Japanese</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cask Type
              </label>
              <input
                {...register('cask_type')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Sherry Oak, Bourbon Barrel"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            placeholder="Describe the whisky's character, history, or unique features..."
          />
        </div>

        {/* Tasting Notes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Tasting Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                {...register('tasting_notes.color')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Deep amber, pale gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nose
              </label>
              <input
                {...register('tasting_notes.nose')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Vanilla, oak, dried fruits"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palate
              </label>
              <input
                {...register('tasting_notes.palate')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Smooth, spicy, honey sweetness"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finish
              </label>
              <input
                {...register('tasting_notes.finish')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Long, warming, subtle smoke"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Pricing */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Inventory & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                {...register('purchase_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price ($)
              </label>
              <input
                {...register('purchase_price', { 
                  min: { value: 0, message: 'Price cannot be negative' }
                })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
              {errors.purchase_price && (
                <p className="mt-1 text-sm text-red-600">{errors.purchase_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Price ($)
              </label>
              <input
                {...register('current_price', { 
                  min: { value: 0, message: 'Price cannot be negative' }
                })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
              {errors.current_price && (
                <p className="mt-1 text-sm text-red-600">{errors.current_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 0, message: 'Quantity cannot be negative' }
                })}
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottle Size (ml)
              </label>
              <select
                {...register('bottle_size')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="50">50ml (Miniature)</option>
                <option value="200">200ml</option>
                <option value="375">375ml (Half Bottle)</option>
                <option value="500">500ml</option>
                <option value="700">700ml (Standard)</option>
                <option value="750">750ml</option>
                <option value="1000">1000ml (1L)</option>
                <option value="1750">1750ml (1.75L)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                {...register('image_url')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="https://example.com/whisky-image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                {...register('is_available')}
                type="checkbox"
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">Available for viewing</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('is_featured')}
                type="checkbox"
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured whisky</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/whiskies')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Update Whisky' : 'Create Whisky'
            )}
          </button>
        </div>
      </form>

      {/* New Distillery Modal */}
      <NewDistilleryModal
        isOpen={showNewDistilleryModal}
        onClose={() => setShowNewDistilleryModal(false)}
        onDistilleryCreated={handleNewDistilleryCreated}
        defaultName={newDistilleryName}
      />
    </div>
  );
};

export default WhiskyForm;
