import React, {useEffect, useState} from 'react';
import {Text, Switch, Button, Alert, ScrollView} from 'react-native';
import {Picker} from '@react-native-picker/picker'; // Импорт из нового местоположения
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserProfileScreen: React.FC = () => {
  const [userParameters, setUserParameters] = useState({
    gender: null,
    size: null,
    build: null,
    role: null,
    footFetish: false,
    chmor: false,
    otherFetishes: false,
    age: null,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const rawData = await AsyncStorage.getItem('userParameters');
      const storedParameters = rawData ? JSON.parse(rawData) : {};
      setUserParameters(prev => ({...prev, ...storedParameters, age: 22}));
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const saveProfileData = async () => {
    try {
      await AsyncStorage.setItem(
        'userParameters',
        JSON.stringify(userParameters),
      );
      Alert.alert('Profile data saved!');
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  };

  return (
    <ScrollView>
      <Text>Возраст:</Text>
      <Picker
        selectedValue={userParameters.age}
        onValueChange={itemValue =>
          setUserParameters(
            prev => ({...prev, age: itemValue ? +itemValue : null} as any),
          )
        }>
        {/*<Picker.Item label="Выберите значение" value={null} />*/}
        {[...Array(82).keys()].map((_, index) => {
          const value = (index + 18).toString();
          return <Picker.Item key={value} label={value} value={value} />;
        })}
      </Picker>
      <Text>Пол:</Text>
      <Picker
        selectedValue={userParameters.gender}
        onValueChange={itemValue =>
          setUserParameters(prev => ({...prev, gender: itemValue}))
        }>
        <Picker.Item label="Выберите пол" value={null} />
        <Picker.Item label="Мужской" value="Male" />
        <Picker.Item label="Женский" value="Female" />
      </Picker>
      <Text>Размер члена:</Text>
      <Picker
        selectedValue={userParameters.size}
        onValueChange={itemValue =>
          setUserParameters(
            prev => ({...prev, size: itemValue ? +itemValue : null} as any),
          )
        }>
        <Picker.Item label="Выберите значение" value={null} />
        {[...Array(56).keys()].map((_, index) => {
          const value = index.toString();
          return <Picker.Item key={value} label={value} value={index} />;
        })}
      </Picker>
      <Text>Строение тела:</Text>
      <Picker
        selectedValue={userParameters.build}
        onValueChange={itemValue =>
          setUserParameters(prev => ({...prev, build: itemValue}))
        }>
        <Picker.Item label="Выберите строение тела" value={null} />
        <Picker.Item label="Среднее" value="Average" />
        <Picker.Item label="Худой" value="Slim" />
        <Picker.Item label="Спортивное" value="Athletic" />
        <Picker.Item label="Полное" value="Full" />
      </Picker>
      <Text>Роль:</Text>
      <Picker
        selectedValue={userParameters.role}
        onValueChange={itemValue =>
          setUserParameters(prev => ({...prev, role: itemValue}))
        }>
        <Picker.Item label="Выберите роль" value={null} />
        <Picker.Item label="Актив" value="Active" />
        <Picker.Item label="Уни" value="Uni" />
        <Picker.Item label="Пассив" value="Passive" />
      </Picker>
      <Text>Фут фетиш:</Text>
      <Switch
        value={userParameters.footFetish}
        onValueChange={itemValue =>
          setUserParameters(prev => ({...prev, footFetish: itemValue}))
        }
      />
      <Text>Чмор:</Text>
      <Switch
        value={userParameters.chmor}
        onValueChange={itemValue =>
          setUserParameters(prev => ({...prev, chmor: itemValue}))
        }
      />
      <Text>Другие фетиши:</Text>
      <Switch
        value={userParameters.otherFetishes}
        onValueChange={itemValue =>
          setUserParameters(prev => ({...prev, otherFetishes: itemValue}))
        }
      />
      <Button title="Сохранить" onPress={saveProfileData} />
    </ScrollView>
  );
};

export default UserProfileScreen;
