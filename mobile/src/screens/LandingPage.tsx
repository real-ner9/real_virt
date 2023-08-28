import React, {useState, useEffect} from 'react';
import {View, Text, TextInput} from 'react-native';
import {Subject} from 'rxjs';
import {NavigationProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateUniqueId} from '../utils/generateUniqueId';
import CustomButton from '../components/CustomButton';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import SearchPartnerTab from '../components/SearchPartnerTab';
import ConnectRoomTab from '../components/ConnectRoomTab';

interface LandingPageProps {
  navigation: NavigationProp<any>;
}

const LandingPage: React.FC<LandingPageProps> = ({navigation}) => {
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
  const Tab = createBottomTabNavigator();
  const [destroy$] = useState(new Subject());
  const [, setUserId] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      destroy$.next(true);
      destroy$.complete();
    };
  }, [destroy$]);

  // @ts-ignore
  return (
    <View style={styles.container}>
      {/*<View style={styles.header}>*/}
      {/*  <Text style={styles.headerText}>GoVirt</Text>*/}
      {/*</View>*/}
      <Tab.Navigator initialRouteName="SearchPartner">
        <Tab.Screen name="Search Partner" component={SearchPartnerTab} />
        <Tab.Screen name="Connect to Room" component={ConnectRoomTab} />
      </Tab.Navigator>
    </View>
  );
};

export default LandingPage;
