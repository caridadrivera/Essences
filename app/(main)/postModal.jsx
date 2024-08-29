// PostModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PaperProvider, Card } from 'react-native-paper'
import RenderHTML from 'react-native-render-html';
import { wp } from '../../helpers/common';
const PostModal = ({ isVisible, post, onClose }) => {
    if (!post) return null; // Render nothing if no post is provided

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Card>
                        <Card.Content style={styles.cardContentStyle}>
                            {post?.body && (
                                <RenderHTML
                                    contentWidth={wp(100)}
                                    source={{ html: post?.body }}
                                />
                            )}
                        </Card.Content>
                    </Card>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonClose]}
                        onPress={onClose}
                    >
                        <Text style={styles.textStyle}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
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
        marginTop: 18,
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
    }
});

export default PostModal;
