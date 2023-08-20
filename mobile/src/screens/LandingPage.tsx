import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, TextInput, Button} from 'react-native';
import {EMPTY, Subject, switchMap} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
import ApiService from '../services/ApiService';
import {NavigationProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateUniqueId} from '../utils/generateUniqueId';

interface LandingPageProps {
  navigation: NavigationProp<any>;
}

const LandingPage: React.FC<LandingPageProps> = ({navigation}) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [destroy$] = useState(new Subject());
  const userId = useMemo(async () => {
    let id = await AsyncStorage.getItem('userId');
    if (!id) {
      id = generateUniqueId();
      await AsyncStorage.setItem('userId', id);
    }
    return id;
  }, []);
  // Новый стейт для отслеживания состояния поиска
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    return () => {
      destroy$.next(true);
      destroy$.complete();
    };
  }, [destroy$]);

  const connectToRoom = () => {
    ApiService.connectToRoom(roomNumber)
      .pipe(
        takeUntil(destroy$),
        catchError(error => {
          console.error('Error connecting to room:', error);
          return EMPTY; // Возвращаем пустой Observable
        }),
      )
      .subscribe(
        () => {
          navigation.navigate('RoomPage', {roomNumber});
        },
        error => {
          console.error('Error connecting to room:', error);
        },
      );
  };

  const handleCreateRoom = () => {
    ApiService.createRoom()
      .pipe(
        switchMap(roomData => {
          return ApiService.connectToRoom(roomData.roomNumber).pipe(
            catchError(error => {
              console.error('Error connecting to room:', error);
              return EMPTY;
            }),
          );
        }),
        takeUntil(destroy$),
      )
      .subscribe(
        roomData => {
          navigation.navigate('RoomPage', {roomNumber: roomData.roomNumber});
        },
        error => {
          console.error('Error creating and connecting to room:', error);
        },
      );
  };

  const handleStopSearch = async () => {
    ApiService.stopSearch(await userId)
      .pipe(takeUntil(destroy$))
      .subscribe(
        () => {
          setIsSearching(false); // обновляем стейт
          console.log('Search stopped.');
        },
        error => {
          setIsSearching(false);
          console.error('Error stopping search:', error);
        },
      );
  };

  const handleSearchForChat = async () => {
    setIsSearching(true);
    ApiService.searchForChat(await userId)
      .pipe(
        takeUntil(destroy$),
        catchError(error => {
          setIsSearching(false);
          console.error('Error searching for chat:', error);
          return EMPTY;
        }),
      )
      .subscribe(
        resultRoomNumber => {
          setIsSearching(false);
          if (resultRoomNumber) {
            navigation.navigate('RoomPage', {roomNumber: resultRoomNumber});
          } else {
            console.log('Chat search ended with no result.');
          }
        },
        error => {
          setIsSearching(false);
          console.error('Error in chat search:', error);
        },
      );
  };

  useEffect(() => {
    return () => {
      destroy$.next(true);
      destroy$.complete();
    };
  }, [destroy$]);

  return (
    <View>
      <Text>Enter Room Number:</Text>
      <TextInput
        value={roomNumber}
        onChangeText={setRoomNumber}
        placeholder="Room Number"
      />
      <Button title="Connect" onPress={connectToRoom} />
      <Button title="Create and Connect" onPress={handleCreateRoom} />
      {isSearching ? (
        <Button title="Stop Searching" onPress={handleStopSearch} />
      ) : (
        <Button title="Search for Chat" onPress={handleSearchForChat} />
      )}
    </View>
  );
};

export default LandingPage;
