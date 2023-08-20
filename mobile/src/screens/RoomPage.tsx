import React, {useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, TextInput, Button} from 'react-native';
import {EMPTY, Subject} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
import ApiService from '../services/ApiService';
import io, {Socket} from 'socket.io-client';
import {generateUniqueId} from '../utils/generateUniqueId';
import {Message} from '../models/Message.model';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    if (messageText.trim() === '') {
      return;
    }

    const message = {
      roomNumber: roomData.roomNumber,
      content: messageText,
      userId: await userId,
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
          <Text>
            {item.user}: {item.content}
          </Text>
        )}
      />
      <TextInput
        value={messageText}
        onChangeText={setMessageText}
        placeholder="Enter your message"
      />
      <Button title="Send" onPress={handleMessage} />
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  );
};

export default RoomPage;
