export const Room = () => {
  function handleHomeNavigation() {
    window.location.href = '/';
  }
  return (
    <div>
      <button onClick={handleHomeNavigation}>Go Home</button>
      <div>Room Component</div>
    </div>
  );
};
