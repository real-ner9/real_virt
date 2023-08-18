import React, {useEffect, useState} from 'react';
import {View, Text, FlatList} from 'react-native';
import {EMPTY, Subject} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
import ApiService from '../services/ApiService';

// TODO настроить ts, у меня не получилось =(
// import {RouteProp} from '@react-navigation/native';

// type RoomPageParams = {
//   roomNumber: string;
// };
//
// type YourStackParamList = {
//   RoomPage: RoomPageParams;
// };
//
// type RoomPageProps = {
//   route: RouteProp<YourStackParamList, 'RoomPage'>;
// };

const RoomPage: React.FC<any> = ({route}) => {
  const [roomData, setRoomData] = useState<{roomNumber: string; messages: any[]}>({
    roomNumber: '',
    messages: [],
  });
  const [destroy$] = useState(new Subject());

  useEffect(() => {
    const {roomNumber} = route.params;

    ApiService.getRoomData(roomNumber)
      .pipe(
        takeUntil(destroy$),
        catchError(error => {
          console.error('Error fetching room data:', error);
          return EMPTY; // Возвращаем пустой Observable
        }),
      )
      .subscribe(
        response => {
          setRoomData(response);
        },
        error => {
          console.error('Error fetching room data:', error);
        },
      );

    return () => {
      destroy$.next(true); // Или другое значение
      destroy$.complete();
    };
  }, [destroy$, route.params]);

  return (
    <View>
      <Text>Room Number: {roomData.roomNumber}</Text>
      <FlatList
        data={roomData.messages}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => <Text>{item.content}</Text>}
      />
    </View>
  );
};

export default RoomPage;
