import { StyleSheet, Text, View, Modal, TouchableOpacity, Button, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Alert } from 'react-native'
import { Calendar } from 'react-native-calendars';
import Input from '../../components/Input';
import { wp } from '../../helpers/common';
import CalendarIconButton from '../../components/CalendarButton';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { supabase } from '../../lib/supabase';
import ButtonComponent from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  



const ReminderModal = () => {

    const { user } = useAuth();
    const router = useRouter();
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
  
    const [loading, setLoading] = useState(false);

    const reminderTopicRef = useRef("");

    useEffect(() => {
        (async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Notification permissions were not granted.');
            }
        })();
    }, []);


    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowPicker(Platform.OS === 'ios');
        setDate(currentDate);
      };
    
    async function scheduleNotification() {
        const triggerDate = new Date(date); 
        triggerDate.setMinutes(triggerDate.getMinutes())
   
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Reminder",
            body: 'This is your scheduled event reminder.',
          },
          trigger: { type: 'date', timestamp: triggerDate},
        });
        alert(`Notification set for ${date}`);
        router.push('/userProfile')
      }
    



    const createReminderTopic = async () => {
        if (!reminderTopicRef.current || !date) {
            Alert.alert('Topic Reminder', "All fields must be filled to create a reminder")
            return;
        }

        setLoading(true)

        const { data, error } = await supabase
            .from('topics')
            .insert([
                {
                    title: reminderTopicRef.current,
                    created_at: new Date(),
                    user_id: user.id,
                    is_reminder: true,
                    reminder_date: date
                }
            ]);

        setLoading(false)
     
        if (error) {
            console.log('Error:', error);
        } else {

        scheduleNotification()
           Alert.alert(
                'Reminder Set',
                `You have selected ${dateString}. We'll remind you to write about your topic on this day.`
            );
        }
    }


    return (

        <View style={[styles.centeredView, styles.container]}>
            <Text>Set Your Reminder</Text>
        <View>
            <Button title="Date" onPress={() => setShowPicker(true)} />
            {showPicker && (
                <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                />)}
            </View>

            <Input placeholder="Topic" onChangeText={value => reminderTopicRef.current = value} />
            <View style={{ width: wp(40) }}>
                <ButtonComponent loading={loading} title={'Set'} onPress={createReminderTopic}></ButtonComponent>
            </View>
        </View>



    )
}


const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primaryDark,

        justifyContent: 'center',
        alignItems: 'center',
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl
    },
    text: {

        color: 'white',
        fontWeight: theme.fonts.bold
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
        backgroundColor: "white",
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    cardContentStyle: {
        backgroundColor: 'lightgrey',
        borderRadius: 10,
        padding: 10
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: "#2196F3",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    media: {
        flexDirection: 'row',
        columnGap: 4,
        marginTop: 8
    },
    container: {
        flex: 1,
        gap: 35,
        paddingHorizontal: wp(5)
    }
});

export default ReminderModal