
export class  Helper{
     handleHomeNavigation() {
        window.location.href = '/';
      }
       nowTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
}