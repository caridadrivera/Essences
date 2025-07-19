import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MasonryList from '@react-native-seoul/masonry-list';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';

const TopicLayout = ({
  label,
  children,
  values,
  selectedValue,
  setSelectedValue,
}) => (
  <View style={{padding: 10, flex: 1}}>
    <Text style={styles.label}>{label}</Text>
     <MasonryList
      data={values}
      keyExtractor={(item) => item}
      numColumns={2}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => setSelectedValue(item)}
          style={[
            styles.button,
            selectedValue === item && styles.selected,
          ]}>
          <Text
            style={[
              styles.buttonLabel,
              selectedValue === item && styles.selectedLabel,
            ]}>
            {item}
          </Text>
        </TouchableOpacity>
 )}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 8
  },
  box: {
    width: 50,
    height: 50,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 18,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryDark,
    alignSelf: 'center',
    alignItems: 'center',
    marginHorizontal: '1%',
    marginBottom: 6,
    minWidth: '48%',
    textAlign: 'center',
  },
  selected: {
    backgroundColor: 'coral',
    borderWidth: 0,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
  },
  selectedLabel: {
    color: 'white',
  },
  label: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 24,
    fontWeight: '500'
  },
});

export default TopicLayout;
// This component is a layout for displaying topics with selectable values.
// It includes a label, a row of buttons for selecting values, and styles for layout and appearance.
// The component is designed to be reusable with different labels and values.
// It uses TouchableOpacity for button interactions and updates the selected value state when a button is pressed.
// The styles are defined using StyleSheet.create for better performance and organization.
// The component is exported as the default export for use in other parts of the application.
// It is a functional component that accepts props for label, children, values, selectedValue, and setSelectedValue.
// The component is styled to be visually appealing and user-friendly, with a focus on accessibility and usability.
// The layout is flexible, allowing for easy integration into various screens or components within the app.
// The component is designed to be responsive, adapting to different screen sizes and orientations.
// It can be used in a variety of contexts, such as filtering topics or selecting options within a topic.
// The component is part of a larger application, likely related to topics or discussions, and serves as a user interface element for interaction.