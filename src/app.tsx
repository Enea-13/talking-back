import { useRoute } from './lib/router';
import { Home } from './screens/Home';
import { Thought } from './screens/Thought';
import { Entry } from './screens/Entry';
import { Saved } from './screens/Saved';
import { About } from './screens/About';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'thought':
      return <Thought key={route.id} id={route.id} />;
    case 'entry':
      return <Entry key={route.id} id={route.id} />;
    case 'saved':
      return <Saved />;
    case 'about':
      return <About />;
    default:
      // Typing replaces the URL without a hashchange, so this only remounts on real navigation.
      return <Home key={route.q} initialQuery={route.q} />;
  }
}
