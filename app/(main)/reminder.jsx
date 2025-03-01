import { StyleSheet, Text, View, Modal, TouchableOpacity, Button, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Alert } from 'react-native'
import { Calendar } from 'react-native-calendars';
import Input from '../../components/Input';
import { wp } from '../../helpers/common';
import CalendarIconButton from '../../components/CalendarButton';
import * as Notifications from 'expo-notifications';
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




const ReminderModal = ({ onClose, isVisible }) => {

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
                body: `Don't forget to write about ${reminderTopicRef.current} today.`,
            },
            trigger: { type: 'date', timestamp: triggerDate },
        });
        alert(`Your reminder has been set for ${date}`);
     
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

            scheduleNotification();
        
            onClose();
        }
    }


    return (

        <Modal animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}>
            <View style={[styles.centeredView, styles.container]}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text>X</Text>
                    </TouchableOpacity>
                    <Text>Set Your Reminder</Text>
                    <CalendarIconButton selectedDate={date} onPress={() => setShowPicker(prev => !prev)} />
                    {showPicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />)}
                    <Input placeholder="Topic" onChangeText={value => reminderTopicRef.current = value} />
                    <View style={{ width: wp(40) }}>
                        <ButtonComponent loading={loading} title={'Set'} onPress={createReminderTopic}></ButtonComponent>
                    </View>
                </View>
            </View>



        </Modal>



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
            height: 8
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        gap: 30
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
        gap: 45,
        paddingHorizontal: wp(8)
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
        zIndex: 1
    }
});

export default ReminderModal