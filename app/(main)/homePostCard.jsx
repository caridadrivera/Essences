import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { wp, hp } from '../../helpers/common';
import { Card } from 'react-native-paper';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { htmlToText } from 'html-to-text';

const HomePostCard = ({ filteredPost }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [truncatedText, setTruncatedText] = useState('');
    const containerRef = useRef(null);

    const MAX_HEIGHT = 50;
    const MAX_CHARACTERS = 100;

    useEffect(() => {
        if (filteredPost?.body) {
          // Convert HTML to plain text
          const plainText = htmlToText(filteredPost.body, {
            wordwrap: false,
          });
    
          if (isOverflowing) {
            // Truncate text if overflowing
            const truncated = plainText.length > MAX_CHARACTERS
              ? plainText.substring(0, MAX_CHARACTERS) + '...'
              : plainText;
            setTruncatedText(truncated);
          } else {
            // Show full text if not overflowing
            setTruncatedText(plainText);
          }
        }
      }, [isOverflowing, filteredPost]);

    const measureContentHeight = (event) => {
        const { height } = event.nativeEvent.layout;
        if (height > MAX_HEIGHT) {
            setIsOverflowing(true);
        } else {
            setIsOverflowing(false);
        }

        console.log(truncatedText)
    };

    return (




        <Card style={{ margin: 20, width: 300, height: 200 }} key={filteredPost.id}>
            <Card.Title
                subtitle={filteredPost.users.name}
                titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
                subtitleStyle={{ fontSize: 14 }}
                left={() => (
                    <Pressable onPress={() => router.push({
                        pathname: '/users/[id]',
                        params: { id: filteredPost.users.id, profile_img: filteredPost.users.profile_image, background_img: filteredPost.users.background_image }
                    }
                    )}>
                        <Avatar uri={filteredPost.users.profile_image} />
                    </Pressable>
                )}
                right={() => (
                    <TouchableOpacity>
                        <Icon name="moreIcon" style={{ margin: 18 }} />
                    </TouchableOpacity>
                )}

            />
            <Card.Content
                style={{
                    margin: 10,
                    padding: 10,
                    backgroundColor: 'lightgrey',
                    borderRadius: 10,
                }}>

                <View style={styles.container}>
                    <View
                        style={styles.content}
                        ref={containerRef}
                        onLayout={measureContentHeight}
                    >
                        {truncatedText ? (
                            <Text style={styles.text}>{truncatedText}</Text>
                        ) : (
                            <RenderHTML
                                contentWidth={wp(100)}
                                source={{ html: filteredPost?.body }}
                                baseStyle={styles.text}
                            />
                        )}
                    </View>
                </View>

            </Card.Content>

            <Card.Actions style={styles.footer}>
                <TouchableOpacity>
                    <Icon name="hexagonIcon" />
                </TouchableOpacity>

            </Card.Actions>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 50,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    },
});

export default HomePostCard;
