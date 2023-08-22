import React, {useState, useEffect} from 'react';
import {Text, Switch, Button, ScrollView} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchScreen: React.FC = () => {
  const [searchParameters, setSearchParameters] = useState({
    gender: 'Не важно',
    minAge: 18,
    maxAge: 99,
    minSize: 0,
    maxSize: 55,
    build: 'Не важно',
    role: 'Не важно',
    footFetish: false,
    chmor: false,
    otherFetishes: false,
  });

  useEffect(() => {
    const loadSearchParameters = async () => {
      try {
        const storedParameters = await AsyncStorage.getItem('searchParameters');
        if (storedParameters) {
          setSearchParameters(JSON.parse(storedParameters));
        }
      } catch (error) {
        console.error('Error loading search parameters:', error);
      }
    };

    loadSearchParameters();
  }, []);

  const saveSearchParameters = async () => {
    try {
      await AsyncStorage.setItem(
        'searchParameters',
        JSON.stringify(searchParameters),
      );
    } catch (error) {
      console.error('Error saving search parameters:', error);
    }
  };

  // ... здесь будет логика для обработки данных и отправки запроса на сервер ...

  return (
    <ScrollView>
      <Text>Возраст (от):</Text>
      <Picker
        selectedValue={searchParameters.minAge}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, minAge: +itemValue}))
        }>
        {[...Array(82).keys()].map((_, index) => {
          const value = (index + 18).toString();
          return <Picker.Item key={value} label={value} value={value} />;
        })}
      </Picker>
      <Text>Возраст (до):</Text>
      <Picker
        selectedValue={searchParameters.maxAge}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, maxAge: +itemValue}))
        }>
        {[...Array(82).keys()].map((_, index) => {
          const value = (index + 18).toString();
          return <Picker.Item key={value} label={value} value={value} />;
        })}
      </Picker>

      <Text>Пол:</Text>
      <Picker
        selectedValue={searchParameters.gender}
        onValueChange={(itemValue: string) =>
          setSearchParameters(prev => ({...prev, gender: itemValue}))
        }>
        <Picker.Item label="Не важно" value="Не важно" />
        <Picker.Item label="Мужской" value="Male" />
        <Picker.Item label="Женский" value="Female" />
      </Picker>

      <Text>Размер члена (от):</Text>
      <Picker
        selectedValue={searchParameters.minSize}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, minSize: +itemValue}))
        }>
        {[...Array(56).keys()].map((_, index) => {
          const value = index.toString();
          return <Picker.Item key={value} label={value} value={value} />;
        })}
      </Picker>
      <Text>Размер члена (до):</Text>
      <Picker
        selectedValue={searchParameters.maxSize}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, maxSize: +itemValue}))
        }>
        {[...Array(56).keys()].map((_, index) => {
          const value = index.toString();
          return <Picker.Item key={value} label={value} value={value} />;
        })}
      </Picker>

      <Text>Строение тела:</Text>
      <Picker
        selectedValue={searchParameters.build}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, build: itemValue}))
        }>
        <Picker.Item label="Не важно" value="" />
        <Picker.Item label="Среднее" value="Average" />
        <Picker.Item label="Худой" value="Slim" />
        <Picker.Item label="Спортивное" value="Athletic" />
        <Picker.Item label="Полное" value="Full" />
      </Picker>

      <Text>Роль:</Text>
      <Picker
        selectedValue={searchParameters.role}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, role: itemValue}))
        }>
        <Picker.Item label="Выберите роль" value="" />
        <Picker.Item label="Актив" value="Active" />
        <Picker.Item label="Уни" value="Uni" />
        <Picker.Item label="Пассив" value="Passive" />
      </Picker>

      <Text>Фут фетиш:</Text>
      <Switch
        value={searchParameters.footFetish}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, footFetish: itemValue}))
        }
      />
      <Text>Чмор:</Text>
      <Switch
        value={searchParameters.chmor}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, chmor: itemValue}))
        }
      />
      <Text>Другие фетиши:</Text>
      <Switch
        value={searchParameters.otherFetishes}
        onValueChange={itemValue =>
          setSearchParameters(prev => ({...prev, otherFetishes: itemValue}))
        }
      />

      <Button
        title="Сохранить"
        onPress={saveSearchParameters /* И добавьте функцию поиска */}
      />
    </ScrollView>
  );
};

export default SearchScreen;
