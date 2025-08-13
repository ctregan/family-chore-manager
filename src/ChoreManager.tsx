import React, { useState, useEffect } from 'react';
import './ChoreManager.css';

interface Chore {
  id: string;
  name: string;
  completed: boolean;
  createdAt: string;
}

interface ChoreData {
  settings: {
    person1Name: string;
    person2Name: string;
  };
  weeks: {
    [weekString: string]: {
      person1?: Chore[];
      person2?: Chore[];
    };
  };
}

const ChoreManager: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [currentPerson, setCurrentPerson] = useState<'person1' | 'person2'>('person1');
  const [data, setData] = useState<ChoreData>({
    settings: {
      person1Name: 'Partner 1',
      person2Name: 'Partner 2'
    },
    weeks: {}
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);
  const [currentPersonForChore, setCurrentPersonForChore] = useState<'person1' | 'person2'>('person1');
  const [choreName, setChoreName] = useState('');
  const [person1Name, setPerson1Name] = useState('');
  const [person2Name, setPerson2Name] = useState('');

  const getWeekString = (date: Date): string => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    };
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  const getDateFromWeekString = (weekString: string): Date => {
    const startDateStr = weekString.split(' - ')[0];
    return new Date(Date.parse(startDateStr + ', ' + new Date().getFullYear()));
  };

  const changeWeek = (direction: number) => {
    const currentDate = getDateFromWeekString(currentWeek);
    currentDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentWeek(getWeekString(currentDate));
  };

  const getChoresForWeekAndPerson = (week: string, person: 'person1' | 'person2'): Chore[] => {
    const weekData = data.weeks[week];
    if (!weekData || !weekData[person]) {
      return [];
    }
    return weekData[person] || [];
  };

  const toggleChore = (choreId: string) => {
    setData(prevData => {
      const newData = { ...prevData };
      const weekData = newData.weeks[currentWeek] || {};
      const personChores = weekData[currentPerson] || [];
      
      const chore = personChores.find(c => c.id === choreId);
      if (chore) {
        chore.completed = !chore.completed;
      }
      
      return newData;
    });
  };

  const deleteChore = (choreId: string) => {
    setData(prevData => {
      const newData = { ...prevData };
      const weekData = newData.weeks[currentWeek] || {};
      const personChores = weekData[currentPerson] || [];
      
      const choreIndex = personChores.findIndex(c => c.id === choreId);
      if (choreIndex > -1) {
        personChores.splice(choreIndex, 1);
      }
      
      return newData;
    });
  };

  const addChore = (name: string, person: 'person1' | 'person2') => {
    if (!name.trim()) return;
    
    setData(prevData => {
      const newData = { ...prevData };
      
      if (!newData.weeks[currentWeek]) {
        newData.weeks[currentWeek] = {};
      }
      
      if (!newData.weeks[currentWeek][person]) {
        newData.weeks[currentWeek][person] = [];
      }
      
      const chore: Chore = {
        id: Date.now().toString(),
        name: name.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      newData.weeks[currentWeek][person]!.push(chore);
      return newData;
    });
  };

  const saveSettings = () => {
    setData(prevData => ({
      ...prevData,
      settings: {
        person1Name: person1Name.trim() || 'Partner 1',
        person2Name: person2Name.trim() || 'Partner 2'
      }
    }));
    setShowSettingsModal(false);
  };

  const saveChore = () => {
    if (choreName.trim()) {
      addChore(choreName, currentPersonForChore);
      setShowAddChoreModal(false);
      setChoreName('');
    }
  };

  const openAddChoreModal = (person: 'person1' | 'person2') => {
    setCurrentPersonForChore(person);
    setShowAddChoreModal(true);
  };

  const openSettingsModal = () => {
    setPerson1Name(data.settings.person1Name);
    setPerson2Name(data.settings.person2Name);
    setShowSettingsModal(true);
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('choreManagerData');
    if (saved) {
      setData(JSON.parse(saved));
    }
    setCurrentWeek(getWeekString(new Date()));
    
    // Register chore-specific service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/chore-sw.js', { scope: '/chores' })
        .then(registration => {
          console.log('Chore Manager Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Chore Manager Service Worker registration failed:', error);
        });
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('choreManagerData', JSON.stringify(data));
  }, [data]);

  const currentChores = getChoresForWeekAndPerson(currentWeek, currentPerson);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <h1>Family Chore Manager</h1>
        </div>
        <div className="week-selector">
          <button className="week-btn" onClick={() => changeWeek(-1)}>←</button>
          <span className="current-week">{currentWeek}</span>
          <button className="week-btn" onClick={() => changeWeek(1)}>→</button>
        </div>
      </header>

      <main className="main-content">
        <div className="person-tabs">
          <button 
            className={`person-tab ${currentPerson === 'person1' ? 'active' : ''}`}
            onClick={() => setCurrentPerson('person1')}
          >
            {data.settings.person1Name}
          </button>
          <button 
            className={`person-tab ${currentPerson === 'person2' ? 'active' : ''}`}
            onClick={() => setCurrentPerson('person2')}
          >
            {data.settings.person2Name}
          </button>
        </div>

        <div className="chore-sections">
          <div className="chore-section active">
            <div className="chore-list">
              {currentChores.map(chore => (
                <div key={chore.id} className={`chore-item ${chore.completed ? 'completed' : ''}`}>
                  <div 
                    className={`chore-checkbox ${chore.completed ? 'checked' : ''}`}
                    onClick={() => toggleChore(chore.id)}
                  >
                    {chore.completed ? '✓' : ''}
                  </div>
                  <span className="chore-name">{chore.name}</span>
                  <button 
                    className="delete-chore"
                    onClick={() => deleteChore(chore.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button 
              className="add-chore-btn"
              onClick={() => openAddChoreModal(currentPerson)}
            >
              + Add Chore
            </button>
          </div>
        </div>
      </main>

      <div className="floating-actions">
        <button className="floating-btn settings-btn" onClick={openSettingsModal}>
          ⚙️
        </button>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowSettingsModal(false)}>
          <div className="modal-content">
            <span className="close-btn" onClick={() => setShowSettingsModal(false)}>&times;</span>
            <h2>Settings</h2>
            <div className="setting-group">
              <label htmlFor="person1Name">Partner 1 Name:</label>
              <input 
                type="text" 
                id="person1Name" 
                value={person1Name}
                onChange={(e) => setPerson1Name(e.target.value)}
                placeholder="Enter name"
                onKeyPress={(e) => e.key === 'Enter' && saveSettings()}
              />
            </div>
            <div className="setting-group">
              <label htmlFor="person2Name">Partner 2 Name:</label>
              <input 
                type="text" 
                id="person2Name" 
                value={person2Name}
                onChange={(e) => setPerson2Name(e.target.value)}
                placeholder="Enter name"
                onKeyPress={(e) => e.key === 'Enter' && saveSettings()}
              />
            </div>
            <button className="save-btn" onClick={saveSettings}>Save Settings</button>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddChoreModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowAddChoreModal(false)}>
          <div className="modal-content">
            <span className="close-btn" onClick={() => setShowAddChoreModal(false)}>&times;</span>
            <h2>Add New Chore</h2>
            <div className="setting-group">
              <label htmlFor="choreName">Chore Name:</label>
              <input 
                type="text" 
                id="choreName" 
                value={choreName}
                onChange={(e) => setChoreName(e.target.value)}
                placeholder="Enter chore name"
                onKeyPress={(e) => e.key === 'Enter' && saveChore()}
                autoFocus
              />
            </div>
            <button className="save-btn" onClick={saveChore}>Add Chore</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChoreManager;