import {Text, TextInput, View} from 'react-native';
import CustomButton from './CustomButton';
import {NavigationProp} from '@react-navigation/native';
import ApiService from '../services/ApiService';
import { catchError, takeUntil } from 'rxjs/operators';
import { EMPTY, Subject, switchMap } from 'rxjs';
import { useEffect, useState } from 'react';

const ConnectRoomTab: React.FC<{navigation: NavigationProp<any>}> = ({
  navigation,
}) => {
  const styles = {
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#F2E9E4',
    },
    header: {
      flex: 1,
      justifyContent: 'center',
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    inputContainer: {
      flex: 1,
    },
    label: {
      fontSize: 16,
      marginBottom: 10,
    },
    input: {
      borderColor: '#ddd',
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
    },
    buttonsContainer: {
      flex: 2,
      justifyContent: 'space-between',
    },
  };
  const [roomNumber, setRoomNumber] = useState('');
  const [destroy$] = useState(new Subject());
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

  useEffect(() => {
    return () => {
      destroy$.next(true);
      destroy$.complete();
    };
  }, [destroy$]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Room Number:</Text>
      <TextInput
        style={styles.input}
        value={roomNumber}
        onChangeText={setRoomNumber}
        placeholder="Room Number"
      />
      <CustomButton title="Connect" onPress={connectToRoom} />
      <CustomButton title="Create and Connect" onPress={handleCreateRoom} />
    </View>
  );
};

export default ConnectRoomTab;
