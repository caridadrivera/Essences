import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';


const CalendarIconButton = ({ onPress, selectedDate, isDateSelected}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Icon name="calendar-outline" size={30} color="#007AFF" />
      {isDateSelected ? 
        <Text style={styles.buttonText}> {selectedDate} </Text> : 
        <Text style={styles.buttonText}>Select Date</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
});

export default CalendarIconButton;
