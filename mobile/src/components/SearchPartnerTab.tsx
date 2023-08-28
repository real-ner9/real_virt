import {NavigationProp} from '@react-navigation/native';
import {View} from 'react-native';
import CustomButton from './CustomButton';
import ApiService from '../services/ApiService';
import {catchError, takeUntil} from 'rxjs/operators';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EMPTY, Subject} from 'rxjs';
import {useEffect, useState} from 'react';
import {generateUniqueId} from '../utils/generateUniqueId';

const SearchPartnerTab: React.FC<{navigation: NavigationProp<any>}> = ({
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
  const [userId, setUserId] = useState<string | null>(null);
  const [destroy$] = useState(new Subject());
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      let id = await AsyncStorage.getItem('userId');
      if (!id) {
        id = generateUniqueId();
        await AsyncStorage.setItem('userId', id);
      }
      setUserId(id);
    };

    fetchUserId();
  }, []);

  const handleStopSearch = () => {
    if (!userId) {
      return;
    }
    ApiService.stopSearch(userId)
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
    if (!userId) {
      return;
    }

    // Загрузка параметров из AsyncStorage
    let loadedUserParameters = null;
    let loadedSearchParameters = null;
    try {
      const rawDataUser = await AsyncStorage.getItem('userParameters');
      loadedUserParameters = rawDataUser ? JSON.parse(rawDataUser) : null;

      const rawDataSearch = await AsyncStorage.getItem('searchParameters');
      loadedSearchParameters = rawDataSearch ? JSON.parse(rawDataSearch) : null;
    } catch (error) {
      console.error('Error loading parameters from AsyncStorage:', error);
    }

    setIsSearching(true);
    ApiService.searchForChat(
      userId,
      loadedUserParameters,
      loadedSearchParameters,
    )
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
    <View style={styles.container}>
      {/*<CustomButton*/}
      {/*  title="Edit Profile"*/}
      {/*  onPress={() => navigation.navigate('UserProfile')}*/}
      {/*/>*/}
      {/*<CustomButton*/}
      {/*  title="Edit Search Parameters"*/}
      {/*  onPress={() => navigation.navigate('SearchParameters')}*/}
      {/*/>*/}
      {isSearching ? (
        <CustomButton title="Stop Searching" onPress={handleStopSearch} />
      ) : (
        <CustomButton title="Search for Chat" onPress={handleSearchForChat} />
      )}
    </View>
  );
};

export default SearchPartnerTab;
