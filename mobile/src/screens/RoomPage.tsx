import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {EMPTY, Subject, take} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
import ApiService from '../services/ApiService';
import io, {Socket} from 'socket.io-client';
import {generateUniqueId} from '../utils/generateUniqueId';
import {Message} from '../models/Message.model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Asset, launchImageLibrary} from 'react-native-image-picker';
import {MediaType} from 'react-native-image-picker';
import Video from 'react-native-video';
import Lightbox from 'react-native-lightbox-v2';

const RoomPage: React.FC<any> = ({route}) => {
  const [roomData, setRoomData] = useState<{
    roomNumber: string;
    messages: Message[];
  }>({
    roomNumber: '',
    messages: [],
  });
  const [destroy$] = useState(new Subject());
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState([] as Asset[]);
  const [uploadedAttachments, setUploadedAttachments] = useState([] as any[]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  // функция для выбора изображения или видео
  const handleChooseAttachment = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      selectionLimit: 6,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorCode);
      } else {
        if (response.assets?.length) {
          setAttachments([...attachments, ...response.assets]);
          response.assets.forEach(asset => {
            ApiService.uploadFile(asset.uri as string, asset.type as string)
              .pipe(take(1))
              .subscribe(
                response => {
                  setUploadedAttachments(prevState => [
                    ...prevState,
                    ...response,
                  ]);
                  console.log('File uploaded successfully:', response);
                },
                error => {
                  console.error('Error uploading file:', error);
                },
              );
          });
        }
      }
    });
  };

  const userId = useMemo(async () => {
    let id = await AsyncStorage.getItem('userId');
    if (!id) {
      id = generateUniqueId();
      await AsyncStorage.setItem('userId', id);
    }
    return id;
  }, []);

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io('http://localhost:3000', {query: {userId}});
    setSocket(s);

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const {roomNumber} = route.params;
    if (socket) {
      (async () => {
        const preparedUserId = await userId;
        socket.emit('joinRoom', {roomNumber, userId: preparedUserId});
      })();

      socket.on('userJoined', ({userId: guestId}) => {
        console.log(`${guestId} joined the room.`);
      });

      socket.on('newMessage', newMessage => {
        setRoomData(prevRoomData => ({
          ...prevRoomData,
          messages: [...prevRoomData.messages, newMessage],
        }));
      });
    }

    ApiService.getRoomData(roomNumber)
      .pipe(
        takeUntil(destroy$),
        catchError(err => {
          console.error('Error fetching room data:', err);
          setError('Произошла ошибка при соединении с комнатой.');
          return EMPTY;
        }),
      )
      .subscribe(
        response => {
          setRoomData(response);
        },
        err => {
          console.error('Error fetching room data:', err);
        },
      );

    return () => {
      destroy$.next(true);
      destroy$.complete();
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params, socket]);

  const handleMessage = async () => {
    if (messageText.trim() === '' && !uploadedAttachments.length) {
      return;
    }

    setUploadedAttachments([]);

    const message = {
      roomNumber: roomData.roomNumber,
      content: messageText,
      userId: await userId,
      attachments: uploadedAttachments,
    };

    if (socket) {
      socket.emit('message', message);
    }

    setMessageText('');
  };

  return (
    <View>
      <Text>Room Number: {roomData.roomNumber}</Text>
      <FlatList
        data={roomData.messages}
        keyExtractor={(item, key) => key.toString()}
        renderItem={({item}) => (
          <>
            <Text>{item.user}</Text>
            <Text>{item.content}</Text>
            <FlatList
              data={item.attachments}
              keyExtractor={(item, key) => key.toString()}
              renderItem={({item}) => {
                if (item.type === 'image') {
                  return (
                    <Lightbox
                      renderContent={() => {
                        return (
                          <Image
                            source={{
                              uri: 'http://localhost:3000/rooms/' + item.url,
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              resizeMode: 'contain',
                            }}
                          />
                        );
                      }}
                      underlayColor="white"
                      springConfig={{tension: 15, friction: 7}}
                      swipeToDismiss={true}>
                      <Image
                        source={{
                          uri: 'http://localhost:3000/rooms/' + item.url,
                        }}
                        style={{width: 100, height: 100}}
                      />
                    </Lightbox>
                  );
                } else if (item.type === 'video') {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentVideo(null);
                        setTimeout(() => {
                          setCurrentVideo(
                            'http://localhost:3000/rooms/' + item.url,
                          );
                          setVideoModalVisible(true);
                        }, 10);
                      }}>
                      <Text>{videoModalVisible}</Text>
                      <Video
                        source={{
                          uri: 'http://localhost:3000/rooms/' + item.url,
                        }}
                        style={{width: 100, height: 100}}
                        paused={true}
                        controls={true}
                      />
                    </TouchableOpacity>
                  );
                }
                return <></>;
              }}
            />
          </>
        )}
      />
      <TextInput
        value={messageText}
        onChangeText={setMessageText}
        placeholder="Enter your message"
      />
      <Button title="Send" onPress={handleMessage} />
      <Button title="Add attachment" onPress={handleChooseAttachment} />
      <FlatList
        data={uploadedAttachments}
        keyExtractor={(item, key) => key.toString()}
        renderItem={({item}) => {
          if (item.type === 'image') {
            return (
              <Lightbox
                renderContent={() => {
                  return (
                    <Image
                      source={{uri: 'http://localhost:3000/rooms/' + item.url}}
                      style={{
                        width: '100%',
                        height: '100%',
                        resizeMode: 'contain',
                      }}
                    />
                  );
                }}
                underlayColor="white"
                springConfig={{tension: 15, friction: 7}}
                swipeToDismiss={true}>
                <Image
                  source={{uri: 'http://localhost:3000/rooms/' + item.url}}
                  style={{width: 100, height: 100}}
                />
              </Lightbox>
            );
          } else if (item.type === 'video') {
            return (
              <TouchableOpacity
                onPress={() => {
                  setCurrentVideo(null);
                  setTimeout(() => {
                    setCurrentVideo('http://localhost:3000/rooms/' + item.url);
                    setVideoModalVisible(true);
                  }, 10);
                }}>
                <Text>{videoModalVisible}</Text>
                <Video
                  source={{uri: 'http://localhost:3000/rooms/' + item.url}}
                  style={{width: 100, height: 100}}
                  paused={true}
                  controls={true}
                />
              </TouchableOpacity>
            );
          }
          return <></>;
        }}
      />

      <Modal
        animationType="slide"
        transparent={false}
        visible={videoModalVisible}
        // Не работает
        onTouchStart={() => {
          setVideoModalVisible(false);
          setCurrentVideo(null);
        }}
        // Не работает
        onDismiss={() => {
          setVideoModalVisible(false);
          setCurrentVideo(null);
        }}
        // Не работает
        onRequestClose={() => {
          setVideoModalVisible(false);
          setCurrentVideo(null);
        }}>
        <View
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
          onTouchStart={() => {
            setVideoModalVisible(false);
            setCurrentVideo(null);
          }}
          // Костыль просто для проверки
        >
          <Video
            source={{uri: currentVideo} as any}
            style={{width: '100%', height: '100%'}}
            controls={true}
            paused={false}
            fullscreenAutorotate={true}
            // Не работает
            onFullscreenPlayerDidDismiss={() => {
              setVideoModalVisible(false);
              setCurrentVideo(null);
            }}
            onRestoreUserInterfaceForPictureInPictureStop={() => {
              setVideoModalVisible(false);
              setCurrentVideo(null);
            }}
            // onAccessibilityAction={event => {
            //   console.log(event);
            // }}
            onEnd={() => setVideoModalVisible(false)}
          />
        </View>
      </Modal>
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  );
};

export default RoomPage;
