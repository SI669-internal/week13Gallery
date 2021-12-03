import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Image, 
  TouchableOpacity, Button, FlatList } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { getDataModel } from './DataModel';
import { getAuth, signOut } from '@firebase/auth';

const auth = getAuth();

export function MainScreen({navigation}) {

  // get a reference to the DataModel
  const dataModel = getDataModel();

  // initialize state with the placeholder image
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [pictures, setPictures] = useState([]);

  // subscribe to updates, specifying the callback
  useEffect(()=>{
    dataModel.addUserSnapshotListener(async () => {
      setUserDisplayName(await dataModel.getCurrentUserDisplayName());
    });
    dataModel.addCurrentUserGalleryListener(pictures => {
      setPictures(pictures);
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
      <View style={styles.gallery}>
        <FlatList
          data={pictures}
          renderItem={({item}) => {
            console.log(item);
            return(
              <View>
                <Image 
                  source={item} 
                  style={styles.galleryImage}/>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gallery: {
    flex: 0.7,
    width: '100%',
    alignItems: 'center'
  },
  galleryImage: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
    margin: 20
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