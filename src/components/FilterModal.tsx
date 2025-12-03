import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobType, ExperienceLevel } from '../types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    type: string;
    experienceLevel: string;
    location: string;
  };
  onFilterChange: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onFilterChange,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const jobTypes = [
    { value: 'all', label: 'All Job Types' },
    { value: JobType.FULL_TIME, label: 'Full Time' },
    { value: JobType.PART_TIME, label: 'Part Time' },
    { value: JobType.INTERNSHIP, label: 'Internship' },
    { value: JobType.CONTRACT, label: 'Contract' },
  ];

  const experienceLevels = [
    { value: 'all', label: 'All Experience Levels' },
    { value: ExperienceLevel.ENTRY_LEVEL, label: 'Entry Level' },
    { value: ExperienceLevel.INTERMEDIATE, label: 'Intermediate' },
    { value: ExperienceLevel.SENIOR, label: 'Senior' },
  ];

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'remote', label: 'Remote' },
    { value: 'new york', label: 'New York' },
    { value: 'san francisco', label: 'San Francisco' },
    { value: 'chicago', label: 'Chicago' },
    { value: 'boston', label: 'Boston' },
    { value: 'los angeles', label: 'Los Angeles' },
    { value: 'seattle', label: 'Seattle' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      type: 'all',
      experienceLevel: 'all',
      location: 'all',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onClose();
  };

  const renderFilterSection = (
    title: string,
    options: { value: string; label: string }[],
    key: string,
    currentValue: string
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              currentValue === option.value && styles.selectedOption,
            ]}
            onPress={() => handleFilterChange(key, option.value)}
          >
            <Text
              style={[
                styles.optionText,
                currentValue === option.value && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderFilterSection(
            'Job Type',
            jobTypes,
            'type',
            localFilters.type
          )}
          
          {renderFilterSection(
            'Experience Level',
            experienceLevels,
            'experienceLevel',
            localFilters.experienceLevel
          )}
          
          {renderFilterSection(
            'Location',
            locations,
            'location',
            localFilters.location
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  selectedOption: {
    backgroundColor: '#6A0032',
    borderColor: '#6A0032',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6A0032',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#6A0032',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6A0032',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterModal; 