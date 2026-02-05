import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import BackButton from '../components/BackButton';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const sendPasswordResetEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: '/login',
      });
      setEmail('')

      if (error) {
        console.error('Error sending password reset email:', error.message);
        alert('Error sending password reset email: ' + error.message);
      } else {
        alert('Password reset email sent successfully!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };


  const handleResetPassword = () => {
    if (email) {
      sendPasswordResetEmail(email);
    } else {
      alert('Please enter your email.');
    }
  };

  return (

    <ScreenWrapper>
       <BackButton router={router}/>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button title="Send Reset Link" onPress={handleResetPassword} />
      </View>
    </ScreenWrapper>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});

export default ForgotPassword;
