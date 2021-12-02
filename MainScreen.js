import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Image, 
  TouchableOpacity, Button } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { getDataModel } from './DataModel';
import { getAuth, signOut } from '@firebase/auth';

const auth = getAuth();

export function MainScreen({navigation}) {

  // get a reference to the DataModel
  const dataModel = getDataModel();

  // initialize state with the placeholder image
  const [userDisplayName, setUserDisplayName] = useState('User');

  // subscribe to updates, specifying the callback
  useEffect(()=>{
    dataModel.addUserSnapshotListener(async () => {
      setUserDisplayName(await dataModel.getCurrentUserDisplayName());
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text> Hi, {userDisplayName}! </Text>
      <Button
        title='Sign out'
        onPress={()=> {
          dataModel.disconnectOnSignout();
          signOut(auth)
        }}
      />
      <TouchableOpacity
        onPress={()=>{navigation.navigate('Camera')}}
      >
        <Icon
          name='photo-camera'
          size={32}
        />
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 100,
    resizeMode: 'contain'
  },

  mainImage: {
    height: 400,
    width: 300,
    resizeMode: 'contain'
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 0.85,
  },
  cameraControls: {
    flex: 0.15, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    padding: '5%',
    width: '100%',
    backgroundColor: '#222'
  },
  snapText: {
    fontSize: 36,
    color: 'white'
  },
});