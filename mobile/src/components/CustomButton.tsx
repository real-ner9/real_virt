import {Text, TouchableOpacity} from 'react-native';

const CustomButton: React.FC<{
  title: string;
  onPress: () => void;
}> = ({title, onPress}) => {
  const styles = {
    // ... (остальные стили)

    button: {
      backgroundColor: '#6C63FF',
      padding: 12,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4, // Для Android
    },
    buttonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },
  };

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
