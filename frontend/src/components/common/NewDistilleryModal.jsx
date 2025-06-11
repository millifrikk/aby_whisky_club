import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const NewDistilleryModal = ({ isOpen, onClose, onDistilleryCreated, defaultName = '' }) => {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: defaultName,
      slug: '',
      country: 'Scotland',
      region: '',
      description: '',
      founded_year: '',
      website: ''
    }
  });

  React.useEffect(() => {
    if (isOpen && defaultName) {
      setValue('name', defaultName);
      setValue('slug', defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [isOpen, defaultName, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Clean up data - ensure empty strings are sent as empty strings, not null
      const cleanData = {
        ...data,
        founded_year: data.founded_year ? parseInt(data.founded_year) : null,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        website: data.website?.trim() || '',
        description: data.description?.trim() || '',
        region: data.region?.trim() || ''
      };

      const response = await adminAPI.createDistillery(cleanData);
      
      // Handle different response structures
      const distillery = response.data?.distillery || response.distillery || response.data;
      
      toast.success('Distillery created successfully!');
      
      if (onDistilleryCreated) {
        onDistilleryCreated(distillery);
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating distillery:', error);
      
      // Enhanced error handling - show specific validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else {
        const message = error.response?.data?.message || 'Failed to create distillery';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setValue('slug', slug);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Distillery</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distillery Name *
                </label>
                <input
                  {...register('name', { 
                    required: 'Distillery name is required',
                    onChange: handleNameChange
                  })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., The Macallan"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  {...register('slug', { required: 'Slug is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., the-macallan"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  {...register('country', { required: 'Country is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="Scotland">Scotland</option>
                  <option value="Ireland">Ireland</option>
                  <option value="United States">United States</option>
                  <option value="Japan">Japan</option>
                  <option value="Canada">Canada</option>
                  <option value="India">India</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="England">England</option>
                  <option value="Wales">Wales</option>
                  <option value="Other">Other</option>
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  {...register('region')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Speyside, Islay, Kentucky"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Founded Year
                </label>
                <input
                  {...register('founded_year', {
                    min: { value: 1700, message: 'Year must be after 1700' },
                    max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                  })}
                  type="number"
                  min="1700"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., 1824"
                />
                {errors.founded_year && (
                  <p className="mt-1 text-sm text-red-600">{errors.founded_year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  {...register('website', {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL (starting with http:// or https://)'
                    }
                  })}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="https://www.distillery.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="Brief description of the distillery..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Distillery'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewDistilleryModal;