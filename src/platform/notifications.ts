export async function getPermissionsAsync() { return { granted: typeof Notification !== 'undefined' && Notification.permission === 'granted', canAskAgain: typeof Notification !== 'undefined' && Notification.permission === 'default' }; }
export async function requestNoticePermission(accept: boolean): Promise<'granted' | 'declined'> {
 if (!accept || typeof Notification === 'undefined') return 'declined';
 return await Notification.requestPermission() === 'granted' ? 'granted' : 'declined';
}
