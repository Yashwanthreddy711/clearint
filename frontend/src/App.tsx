import { Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Room } from './pages/Room';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
};

export default App;
