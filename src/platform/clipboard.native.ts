import Clipboard from '@react-native-clipboard/clipboard';
export async function getStringAsync(){return Clipboard.getString()}
export async function setStringAsync(text:string){Clipboard.setString(text)}
