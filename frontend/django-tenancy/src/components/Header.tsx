import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <header className="bg-gray-100 p-5 mb-5 rounded-lg">
      <nav className="flex justify-between items-center">
        <div className="nav-links">
          <a href="/projects" className="mr-4 text-blue-600 hover:underline">Projetos</a>
          {user && <a href="/profile" className="text-blue-600 hover:underline">Perfil</a>}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="font-bold text-gray-800">Bem vindo, {user.username}!</span>
              <button 
                onClick={onLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <span className="text-gray-600">Visitante</span>
              <a 
                href="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Entrar
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
