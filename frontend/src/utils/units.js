import { useSettings } from '../contexts/SettingsContext';

/**
 * Formats a volume amount with the specified unit
 * @param {number} amount - The volume amount to format
 * @param {string} unit - Volume unit (e.g., 'ml', 'cl', 'l', 'fl oz')
 * @returns {string} Formatted volume string
 */
export const formatVolume = (amount, unit = 'ml') => {
  if (!amount && amount !== 0) return '';
  return `${amount}${unit}`;
};

/**
 * Formats a weight amount with the specified unit
 * @param {number} amount - The weight amount to format
 * @param {string} unit - Weight unit (e.g., 'kg', 'g', 'lb', 'oz')
 * @returns {string} Formatted weight string
 */
export const formatWeight = (amount, unit = 'kg') => {
  if (!amount && amount !== 0) return '';
  return `${amount}${unit}`;
};

/**
 * Formats a temperature amount with the specified unit
 * @param {number} amount - The temperature amount to format
 * @param {string} unit - Temperature unit (e.g., '°C', '°F')
 * @returns {string} Formatted temperature string
 */
export const formatTemperature = (amount, unit = '°C') => {
  if (!amount && amount !== 0) return '';
  return `${amount}${unit}`;
};

/**
 * Formats a distance amount with the specified unit
 * @param {number} amount - The distance amount to format
 * @param {string} unit - Distance unit (e.g., 'km', 'mi', 'm', 'ft')
 * @returns {string} Formatted distance string
 */
export const formatDistance = (amount, unit = 'km') => {
  if (!amount && amount !== 0) return '';
  return `${amount}${unit}`;
};

/**
 * Custom hook that provides units-related functionality
 * Uses admin settings for unit preferences
 * @returns {object} Units utilities and formatting functions
 */
export const useUnits = () => {
  const { settings, loading } = useSettings();
  
  const volumeUnit = settings.volume_unit || 'ml';
  const weightUnit = settings.weight_unit || 'kg';
  const temperatureUnit = settings.temperature_unit || '°C';
  const distanceUnit = settings.distance_unit || 'km';
  
  console.log('📏 useUnits: Settings loaded:', { 
    volumeUnit, 
    weightUnit, 
    temperatureUnit, 
    distanceUnit, 
    loading, 
    settings 
  });
  
  /**
   * Format a volume using the current admin unit settings
   * @param {number} amount - Amount to format
   * @returns {string} Formatted volume string
   */
  const formatVolumeWithSettings = (amount) => {
    return formatVolume(amount, volumeUnit);
  };
  
  /**
   * Format a weight using the current admin unit settings
   * @param {number} amount - Amount to format
   * @returns {string} Formatted weight string
   */
  const formatWeightWithSettings = (amount) => {
    return formatWeight(amount, weightUnit);
  };
  
  /**
   * Format a temperature using the current admin unit settings
   * @param {number} amount - Amount to format
   * @returns {string} Formatted temperature string
   */
  const formatTemperatureWithSettings = (amount) => {
    return formatTemperature(amount, temperatureUnit);
  };
  
  /**
   * Format a distance using the current admin unit settings
   * @param {number} amount - Amount to format
   * @returns {string} Formatted distance string
   */
  const formatDistanceWithSettings = (amount) => {
    return formatDistance(amount, distanceUnit);
  };
  
  /**
   * Get just the volume unit for display in labels
   * @returns {string} Volume unit
   */
  const getVolumeUnit = () => volumeUnit;
  
  /**
   * Get just the weight unit for display in labels
   * @returns {string} Weight unit
   */
  const getWeightUnit = () => weightUnit;
  
  /**
   * Get just the temperature unit for display in labels
   * @returns {string} Temperature unit
   */
  const getTemperatureUnit = () => temperatureUnit;
  
  /**
   * Get just the distance unit for display in labels
   * @returns {string} Distance unit
   */
  const getDistanceUnit = () => distanceUnit;
  
  /**
   * Check if unit settings are loaded
   * @returns {boolean} True if settings are loaded
   */
  const isLoaded = () => !loading;
  
  return {
    // Individual units
    volumeUnit,
    weightUnit,
    temperatureUnit,
    distanceUnit,
    
    // Formatting functions
    formatVolume: formatVolumeWithSettings,
    formatWeight: formatWeightWithSettings,
    formatTemperature: formatTemperatureWithSettings,
    formatDistance: formatDistanceWithSettings,
    
    // Unit getters
    getVolumeUnit,
    getWeightUnit,
    getTemperatureUnit,
    getDistanceUnit,
    
    // Status
    isLoaded
  };
};

// Named exports for direct use without hook
export const formatVolumeWithUnit = formatVolume;
export const formatWeightWithUnit = formatWeight;
export const formatTemperatureWithUnit = formatTemperature;
export const formatDistanceWithUnit = formatDistance;