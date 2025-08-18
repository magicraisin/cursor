'use client';

import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import styles from './styles.module.css';

interface Question {
  text: string;
  answers: { text?: string; image?: string; value: string }[];
}

interface AgentProfile {
  name: string;
  image?: string;
  strengths: string[];
  weaknesses: string[];
}



const AGENT_IMAGES = [
  'apple.png', 'banana.png', 'bell.png', 'book-wiki.png', 'book.png',
  'brackets.png', 'cactus.png', 'clippy.png', 'cloud-flower.png',
  'coffee.png', 'command.png', 'double-copy.png', 'formula.png',
  'gear.png', 'greek-god.png', 'heart.png', 'infinity-glasses.png',
  'lightbulb.png', 'math.png', 'music.png', 'notetaker.png',
  'phone.png', 'repeat-cycle.png', 'research.png', 'root.png',
  'saucy.png', 'scribble.png', 'single-arrow.png', 'single-eye.png',
  'single-loop.png', 'spiky.png', 'time-schedule.png', 'umbrella.png'
];

interface RoamingAgent {
  id: string;
  image: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  hasAppeared: boolean;
  appearDelay: number;
  isHovered: boolean;
  isDragging: boolean;
  isStationary: boolean;
  dragStartX: number;
  dragStartY: number;
  lastX: number;
  lastY: number;
  appearProgress: number; // 0 to 1, for pop-in animation
  appearStartTime: number; // when the pop-in animation started
}

interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniAgent {
  id: string;
  image: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
}

function MiniRoamingAgents({ leaderboardData, totalResults }: { 
  leaderboardData: any[], 
  totalResults: number 
}) {
  const [frameWidth, setFrameWidth] = useState(400);
  const [frameHeight, setFrameHeight] = useState(180);
  const MINI_SPEED = 0.3;
  
  // Update frame dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setFrameWidth(containerWidth);
        
        // Height based on screen size
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) {
          setFrameHeight(120);
        } else if (screenWidth <= 768) {
          setFrameHeight(140);
        } else {
          setFrameHeight(180);
        }
      }
    };
    
    // Initial update
    setTimeout(updateDimensions, 100); // Small delay to ensure container is rendered
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Calculate agent size based on total participants (smaller when more people)
  const getAgentSize = (totalParticipants: number): number => {
    if (totalParticipants <= 5) return 40;
    if (totalParticipants <= 15) return 30;
    if (totalParticipants <= 30) return 25;
    if (totalParticipants <= 50) return 20;
    return 15; // Very small for lots of participants
  };
  
  const agentSize = getAgentSize(totalResults);
  const agentRadius = agentSize / 2;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [miniAgents, setMiniAgents] = useState<MiniAgent[]>([]);
  
  // Generate agents based on leaderboard data
  useEffect(() => {
    const agents: MiniAgent[] = [];
    let agentId = 0;
    
    leaderboardData.forEach(entry => {
      // Add one agent for each person who got this result
      for (let i = 0; i < entry.count; i++) {
        const x = agentRadius + Math.random() * (frameWidth - 2 * agentRadius);
        const y = agentRadius + Math.random() * (frameHeight - 2 * agentRadius);
        
        // Get the correct agent image filename - use same logic as main getAgentImage function
        const getAgentImageFilename = (agentName: string): string => {
          // Handle special cases first
          if (agentName === 'Greek God') {
            return 'greek-god.png';
          }
          
          // Handle renamed agents that still use original filenames
          if (agentName === 'Whoosh Arrow') {
            return 'single-arrow.png';
          }
          if (agentName === 'Repetition') {
            return 'repeat-cycle.png';
          }
          if (agentName === 'Clock') {
            return 'time-schedule.png';
          }
          if (agentName === 'Swish') {
            return 'single-loop.png';
          }
          
          // Convert agent name to filename format
          const filename = agentName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace('/', '-');
          return `${filename}.png`;
        };

        agents.push({
          id: `mini-${agentId++}`,
          image: getAgentImageFilename(entry.agent),
          x,
          y,
          vx: (Math.random() - 0.5) * MINI_SPEED * 2,
          vy: (Math.random() - 0.5) * MINI_SPEED * 2,
          radius: agentRadius,
          rotation: Math.random() * 360,
        });
      }
    });
    
    setMiniAgents(agents);
  }, [leaderboardData, totalResults, agentRadius, frameWidth, frameHeight]);
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      setMiniAgents(prevAgents => {
        return prevAgents.map(agent => {
          let newX = agent.x + agent.vx;
          let newY = agent.y + agent.vy;
          let newVx = agent.vx;
          let newVy = agent.vy;
          
          // Bounce off walls
          if (newX - agent.radius <= 0 || newX + agent.radius >= frameWidth) {
            newVx = -newVx * 0.8;
            newX = Math.max(agent.radius, Math.min(frameWidth - agent.radius, newX));
          }
          
          if (newY - agent.radius <= 0 || newY + agent.radius >= frameHeight) {
            newVy = -newVy * 0.8;
            newY = Math.max(agent.radius, Math.min(frameHeight - agent.radius, newY));
          }
          
          return {
            ...agent,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: agent.rotation + 1,
          };
        });
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (miniAgents.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [miniAgents.length]);
  
  const handleExpandFullScreen = () => {
    // Generate complete leaderboard including 0-count agents
    const allAgentNames = Object.values(agents).map(agent => agent.name);
    const apiDataMap = new Map(leaderboardData.map(entry => [entry.agent, entry.count]));
    const completeLeaderboard = allAgentNames.map(agentName => ({
      agent: agentName,
      count: apiDataMap.get(agentName) || 0
    })).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.agent.localeCompare(b.agent);
    });
    
    // Create the data to pass to the full screen view
    const fullScreenData = {
      leaderboardData: completeLeaderboard,
      totalResults,
      agentSize,
      miniAgents
    };
    
    // Open in new tab
    const newTab = window.open('', '_blank');
    if (newTab) {
      // Create the HTML content for the full screen view
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Notion Agent Activity - Full Screen</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              background: #F7F6F3;
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif;
              height: 100vh;
              overflow: hidden;
            }
            .fullScreenContainer {
              position: relative;
              width: 100vw;
              height: 100vh;
              background: #F7F6F3;
              overflow: hidden;
            }
            .fullScreenAgent {
              position: absolute;
              border-radius: 50%;
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
              z-index: 10;
              padding: 0;
              margin: 0;
              transition: transform 0.1s ease;
            }
            .fullScreenAgent img {
              display: block;
              object-fit: cover;
              border-radius: 50%;
              width: 100%;
              height: 100%;
            }
            .floatingLeaderboard {
              position: fixed;
              top: 16px;
              left: 16px;
              width: 300px;
              max-height: calc(100vh - 32px);
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 12px;
              border: 1px solid rgba(0, 0, 0, 0.1);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              z-index: 100;
              display: flex;
              flex-direction: column;
            }
            .leaderboardHeader {
              padding: 16px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.1);
              background: rgba(255, 255, 255, 0.5);
              border-radius: 12px 12px 0 0;
            }
            .leaderboardTitle {
              font-size: 18px;
              font-weight: 600;
              color: #2c2c2c;
              margin: 0;
            }
            .leaderboardSubtitle {
              font-size: 14px;
              color: #666;
              margin: 4px 0 0 0;
            }
            .leaderboardContent {
              flex: 1;
              overflow-y: auto;
              padding: 0 0 16px 0;
            }
            .leaderboardItem {
              display: flex;
              align-items: center;
              padding: 12px 16px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
              transition: background-color 0.2s ease;
              cursor: pointer;
            }
            .leaderboardItem:hover {
              background-color: rgba(0, 0, 0, 0.04);
            }
            .leaderboardItem:last-child {
              border-bottom: none;
            }

            .leaderboardAgent {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              margin-right: 12px;
              overflow: hidden;
            }
            .leaderboardAgent img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .leaderboardInfo {
              flex: 1;
            }
            .leaderboardName {
              font-size: 14px;
              font-weight: 500;
              color: #2c2c2c;
              margin: 0 0 2px 0;
            }
            .leaderboardPersonality {
              font-size: 11px;
              color: #666;
              font-family: 'SF Mono', monospace;
            }
            .leaderboardCount {
              font-size: 16px;
              font-weight: 400;
              color: #2c2c2c;
            }
            .leaderboardItem.zeroCount {
              opacity: 0.4;
            }
            .leaderboardItem.zeroCount .leaderboardAgent img {
              filter: grayscale(100%);
            }
            
            /* Agent Modal Styles */
            .agentModal {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 1000;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16px;
            }
            
            .agentModalOverlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(4px);
            }
            
            .agentModalContent {
              position: relative;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              width: 576px;
              height: 652px;
              overflow: hidden;
              z-index: 1001;
              flex-shrink: 0;
              display: flex;
              flex-direction: column;
            }
            
            .agentModalBody {
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              flex: 1;
            }
            
            .agentModalBody img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              border-radius: 8px;
            }

            /* Responsive behavior for short viewports - same logic as leaderboard modal */
            @media (max-height: 700px) {
              .agentModal {
                align-items: flex-start !important;
                justify-content: center !important;
                padding-top: 24px !important;
                padding-bottom: 24px !important;
                min-height: 100vh !important;
                max-height: 100vh !important;
                overflow-y: auto !important;
              }
              
              .agentModalContent {
                width: 576px !important;
                height: 652px !important;
                max-height: none !important;
                flex-shrink: 0 !important;
                margin: 0 !important;
              }
            }

            /* Mobile adjustments */
            @media (max-width: 768px) {
              .agentModalContent {
                width: calc(100vw - 32px) !important;
                max-width: 576px !important;
                height: 652px !important;
                max-height: none !important;
                flex-shrink: 0 !important;
                margin: 0 !important;
              }
            }
            
            .agentModalClose {
              background: none;
              border: none;
              font-size: 18px;
              cursor: pointer;
              color: #6b7280;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
            }
            
            .agentModalClose:hover {
              background: #e5e7eb;
            }
            
            .leaderboardChevron {
              opacity: 0.6;
              transition: opacity 0.2s ease;
            }
            
            .leaderboardNameContainer:hover .leaderboardChevron {
              opacity: 1;
            }
          </style>
        </head>
        <body>
          <div id="container" class="fullScreenContainer"></div>
          <div class="floatingLeaderboard">
            <div class="leaderboardHeader">
              <h3 class="leaderboardTitle">Leaderboard</h3>
              <p class="leaderboardSubtitle">${totalResults} participant${totalResults === 1 ? '' : 's'}</p>
            </div>
            <div id="leaderboardContent" class="leaderboardContent">
              <!-- Leaderboard items will be inserted here -->
            </div>
          </div>
          
          <!-- Agent Modal -->
          <div class="agentModal" id="agentModal" style="display: none;">
            <div class="agentModalOverlay" onclick="closeAgentModal()"></div>
            <div class="agentModalContent">
              <div class="agentModalBody">
                <img id="agentModalImage" src="" alt="" />
              </div>
            </div>
          </div>
          <script>
            const leaderboardData = ${JSON.stringify(leaderboardData)};
            const totalResults = ${totalResults};
            
            // Full screen dimensions
            const frameWidth = window.innerWidth;
            const frameHeight = window.innerHeight;
            const SPEED = 0.4;
            
            // Calculate scaled agent size for full screen
            const getFullScreenAgentSize = (totalParticipants) => {
              const baseSize = Math.min(frameWidth, frameHeight) * 0.08; // 8% of smallest dimension
              if (totalParticipants <= 5) return Math.max(baseSize, 80);
              if (totalParticipants <= 15) return Math.max(baseSize * 0.8, 60);
              if (totalParticipants <= 30) return Math.max(baseSize * 0.6, 45);
              if (totalParticipants <= 50) return Math.max(baseSize * 0.5, 35);
              return Math.max(baseSize * 0.4, 25);
            };
            
            const agentSize = getFullScreenAgentSize(totalResults);
            const agentRadius = agentSize / 2;
            
            // Generate agents
            const agents = [];
            let agentId = 0;
            
            const getAgentImageFilename = (agentName) => {
              if (agentName === 'Greek God') return 'greek-god.png';
              if (agentName === 'Whoosh Arrow') return 'single-arrow.png';
              if (agentName === 'Repetition') return 'repeat-cycle.png';
              if (agentName === 'Clock') return 'time-schedule.png';
              if (agentName === 'Swish') return 'single-loop.png';
              return agentName.toLowerCase().replace(/\\s+/g, '-').replace('/', '-') + '.png';
            };
            
            // Helper function to get display name for agents in leaderboard
            const getAgentDisplayName = (agentName) => {
              if (agentName === 'Book Wiki') {
                return 'Wiki';
              }
              return agentName;
            };
            
            // Agent card image mapping for modal
            const getAgentCardImage = (agentName) => {
              const nameMapping = {
                'Greek God': 'Greek god.png',
                'Cloud Flower': 'Cloud flower.png',
                'Double Copy': 'Double Copy.png',
                'Infinity Glasses': 'Infinity Glasses.png',
                'Repetition': 'Repeat Cycle.png',
                'Whoosh Arrow': 'Single arrow.png',
                'Swish': 'Single loop.png',
                'Clock': 'Time schedule.png',
                'Book Wiki': 'Book Wiki.png',
                'Apple': 'Apple.png',
                'Banana': 'Banana.png',
                'Bell': 'Bell.png',
                'Book': 'Book.png',
                'Brackets': 'Brackets.png',
                'Cactus': 'Cactus.png',
                'Clippy': 'Clippy.png',
                'Coffee': 'Coffee.png',
                'Command': 'Command.png',
                'Formula': 'Formula.png',
                'Gear': 'Gear.png',
                'Heart': 'Heart.png',
                'Lightbulb': 'Lightbulb.png',
                'Math': 'Math.png',
                'Music': 'Music.png',
                'Notetaker': 'Notetaker.png',
                'Phone': 'Phone.png',
                'Research': 'Research.png',
                'Root': 'Root.png',
                'Saucy': 'Saucy.png',
                'Scribble': 'Scribble.png',
                'Spiky': 'Spiky.png',
                'Umbrella': 'Umbrella.png'
              };
              
              const filename = nameMapping[agentName] || agentName + '.png';
              return '/images/agent-cards/' + filename;
            };
            
            // Modal functions
            const openAgentModal = (agentName) => {
              const modal = document.getElementById('agentModal');
              const image = document.getElementById('agentModalImage');
              
              image.src = getAgentCardImage(agentName);
              image.alt = agentName + ' Agent Card';
              
              modal.style.display = 'flex';
              document.body.style.overflow = 'hidden';
            };
            
            const closeAgentModal = () => {
              const modal = document.getElementById('agentModal');
              modal.style.display = 'none';
              document.body.style.overflow = 'auto';
            };
            
            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                closeAgentModal();
              }
            });
            
            // Only include agents with count > 0 for the animation
            leaderboardData.filter(entry => entry.count > 0).forEach(entry => {
              for (let i = 0; i < entry.count; i++) {
                const x = agentRadius + Math.random() * (frameWidth - 2 * agentRadius);
                const y = agentRadius + Math.random() * (frameHeight - 2 * agentRadius);
                
                agents.push({
                  id: 'full-' + agentId++,
                  image: getAgentImageFilename(entry.agent),
                  agentName: entry.agent, // Store the agent name for modal functionality
                  x,
                  y,
                  vx: (Math.random() - 0.5) * SPEED * 2,
                  vy: (Math.random() - 0.5) * SPEED * 2,
                  radius: agentRadius,
                  rotation: Math.random() * 360,
                });
              }
            });
            
            // Create agent elements
            const container = document.getElementById('container');
            const agentElements = {};
            
            agents.forEach(agent => {
              const agentEl = document.createElement('div');
              agentEl.className = 'fullScreenAgent';
              agentEl.style.width = agentSize + 'px';
              agentEl.style.height = agentSize + 'px';
              agentEl.style.cursor = 'pointer';
              
              // Add click handler to open agent modal
              agentEl.onclick = () => openAgentModal(agent.agentName);
              
              const img = document.createElement('img');
              img.src = '/images/agents/' + agent.image;
              img.alt = 'Agent';
              agentEl.appendChild(img);
              
              container.appendChild(agentEl);
              agentElements[agent.id] = agentEl;
            });
            
            // Animation loop
            const animate = () => {
              agents.forEach(agent => {
                let newX = agent.x + agent.vx;
                let newY = agent.y + agent.vy;
                
                // Bounce off walls
                if (newX - agent.radius <= 0 || newX + agent.radius >= frameWidth) {
                  agent.vx = -agent.vx * 0.8;
                  newX = Math.max(agent.radius, Math.min(frameWidth - agent.radius, newX));
                }
                
                if (newY - agent.radius <= 0 || newY + agent.radius >= frameHeight) {
                  agent.vy = -agent.vy * 0.8;
                  newY = Math.max(agent.radius, Math.min(frameHeight - agent.radius, newY));
                }
                
                agent.x = newX;
                agent.y = newY;
                agent.rotation += 0.5;
                
                // Update element position
                const el = agentElements[agent.id];
                if (el) {
                  el.style.left = (agent.x - agent.radius) + 'px';
                  el.style.top = (agent.y - agent.radius) + 'px';
                  el.style.transform = 'rotate(' + agent.rotation + 'deg)';
                }
              });
              
              requestAnimationFrame(animate);
            };
            
            // Populate leaderboard
            const populateLeaderboard = () => {
              const leaderboardContent = document.getElementById('leaderboardContent');
              
              leaderboardData.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboardItem';
                
                // Add gray styling for zero count agents
                if (entry.count === 0) {
                  item.classList.add('zeroCount');
                }
                
                const agentDiv = document.createElement('div');
                agentDiv.className = 'leaderboardAgent';
                
                const agentImg = document.createElement('img');
                agentImg.src = '/images/agents/' + getAgentImageFilename(entry.agent);
                agentImg.alt = getAgentDisplayName(entry.agent);
                agentDiv.appendChild(agentImg);
                
                const info = document.createElement('div');
                info.className = 'leaderboardInfo';
                
                const nameContainer = document.createElement('div');
                nameContainer.className = 'leaderboardNameContainer';
                nameContainer.style.display = 'flex';
                nameContainer.style.alignItems = 'center';
                nameContainer.style.gap = '8px';
                nameContainer.style.cursor = 'pointer';
                nameContainer.onclick = () => openAgentModal(entry.agent);
                
                const name = document.createElement('div');
                name.className = 'leaderboardName';
                name.textContent = getAgentDisplayName(entry.agent);
                
                const chevron = document.createElement('svg');
                chevron.setAttribute('width', '16');
                chevron.setAttribute('height', '16');
                chevron.setAttribute('viewBox', '0 0 24 24');
                chevron.setAttribute('fill', 'none');
                chevron.innerHTML = '<path d="M9 18l6-6-6-6" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                chevron.className = 'leaderboardChevron';
                
                nameContainer.appendChild(name);
                nameContainer.appendChild(chevron);
                
                const personality = document.createElement('div');
                personality.className = 'leaderboardPersonality';
                personality.textContent = entry.personality;
                
                info.appendChild(nameContainer);
                info.appendChild(personality);
                
                const count = document.createElement('div');
                count.className = 'leaderboardCount';
                count.textContent = entry.count.toString();
                
                item.appendChild(agentDiv);
                item.appendChild(info);
                item.appendChild(count);
                
                leaderboardContent.appendChild(item);
              });
            };
            
            populateLeaderboard();
            animate();
          </script>
        </body>
        </html>
      `;
      
      newTab.document.write(htmlContent);
      newTab.document.close();
    }
  };

  if (totalResults === 0) return null;
  
  return (
    <div className={styles.miniRoamingContainer} ref={containerRef}>
      <button className={styles.expandButton} onClick={handleExpandFullScreen} title="Open full screen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {miniAgents.map(agent => (
        <div
          key={agent.id}
          className={styles.miniRoamingAgent}
          style={{
            left: `${agent.x - agent.radius}px`,
            top: `${agent.y - agent.radius}px`,
            width: `${agentSize}px`,
            height: `${agentSize}px`,
            transform: `rotate(${agent.rotation}deg)`,
          }}
        >
          <img
            src={`/images/agents/${agent.image}`}
            alt="mini agent"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ))}
      

    </div>
  );
  }


function BackgroundRoamingAgents({ agentName }: { agentName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [backgroundAgents, setBackgroundAgents] = useState<MiniAgent[]>([]);
  
  // Mobile detection and agent count optimization
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const AGENT_COUNT = isMobile ? 10 : 30; // Reduce agents on mobile
  const AGENT_SIZE = 100; // Larger background agents
  const AGENT_RADIUS = AGENT_SIZE / 2;
  const BACKGROUND_SPEED = 0.25; // Slower background movement
  
  // Get agent image using same logic as main component
  const getAgentImagePath = (name: string): string => {
    if (name === 'Greek God') {
      return '/images/agents/greek-god.png';
    }
    
    // Handle renamed agents that still use original filenames
    if (name === 'Whoosh Arrow') {
      return '/images/agents/single-arrow.png';
    }
    if (name === 'Repetition') {
      return '/images/agents/repeat-cycle.png';
    }
    if (name === 'Clock') {
      return '/images/agents/time-schedule.png';
    }
    if (name === 'Swish') {
      return '/images/agents/single-loop.png';
    }
    
    const filename = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace('/', '-');
    return `/images/agents/${filename}.png`;
  };

  // Initialize background agents
  useEffect(() => {
    if (!containerRef.current) return;
    
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    const agents: MiniAgent[] = Array.from({ length: AGENT_COUNT }, (_, index) => {
      const x = AGENT_RADIUS + Math.random() * (containerWidth - 2 * AGENT_RADIUS);
      const y = AGENT_RADIUS + Math.random() * (containerHeight - 2 * AGENT_RADIUS);
      
      return {
        id: `bg-${index}`,
        image: getAgentImagePath(agentName),
        x,
        y,
        vx: (Math.random() - 0.5) * BACKGROUND_SPEED * 2,
        vy: (Math.random() - 0.5) * BACKGROUND_SPEED * 2,
        radius: AGENT_RADIUS,
        rotation: Math.random() * 360,
      };
    });
    
    setBackgroundAgents(agents);
  }, [agentName, AGENT_COUNT]); // Re-initialize when agent count changes

  // Animation loop for background agents
  useEffect(() => {
    const animate = () => {
      setBackgroundAgents(prevAgents => {
        const updatedAgents = prevAgents.map(agent => {
          let newX = agent.x + agent.vx;
          let newY = agent.y + agent.vy;
          let newVx = agent.vx;
          let newVy = agent.vy;
          
          const containerWidth = window.innerWidth;
          const containerHeight = window.innerHeight;
          
          // Bounce off walls
          if (newX - agent.radius <= 0 || newX + agent.radius >= containerWidth) {
            newVx = -newVx * 0.8;
            newX = Math.max(agent.radius, Math.min(containerWidth - agent.radius, newX));
          }
          
          if (newY - agent.radius <= 0 || newY + agent.radius >= containerHeight) {
            newVy = -newVy * 0.8;
            newY = Math.max(agent.radius, Math.min(containerHeight - agent.radius, newY));
          }
          
          return {
            ...agent,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: agent.rotation + 0.1, // Much slower rotation
          };
        });

        // Check for agent-to-agent collisions
        for (let i = 0; i < updatedAgents.length; i++) {
          for (let j = i + 1; j < updatedAgents.length; j++) {
            const agent1 = updatedAgents[i];
            const agent2 = updatedAgents[j];
            
            const dx = agent2.x - agent1.x;
            const dy = agent2.y - agent1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = agent1.radius + agent2.radius;
            
            if (distance < minDistance) {
              // Collision detected - calculate bounce
              const angle = Math.atan2(dy, dx);
              const sin = Math.sin(angle);
              const cos = Math.cos(angle);
              
              // Rotate velocities to collision coordinate system
              const v1x = agent1.vx * cos + agent1.vy * sin;
              const v1y = agent1.vy * cos - agent1.vx * sin;
              const v2x = agent2.vx * cos + agent2.vy * sin;
              const v2y = agent2.vy * cos - agent2.vx * sin;
              
              // Swap velocities in collision direction (elastic collision)
              const newV1x = v2x;
              const newV2x = v1x;
              
              // Rotate velocities back to original coordinate system
              updatedAgents[i].vx = newV1x * cos - v1y * sin;
              updatedAgents[i].vy = v1y * cos + newV1x * sin;
              updatedAgents[j].vx = newV2x * cos - v2y * sin;
              updatedAgents[j].vy = v2y * cos + newV2x * sin;
              
              // Separate agents to prevent overlap
              const overlap = minDistance - distance;
              const separateX = (overlap / 2) * cos;
              const separateY = (overlap / 2) * sin;
              
              updatedAgents[i].x -= separateX;
              updatedAgents[i].y -= separateY;
              updatedAgents[j].x += separateX;
              updatedAgents[j].y += separateY;
            }
          }
        }
        
        return updatedAgents;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (backgroundAgents.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [backgroundAgents.length]);

  return (
    <div className={styles.backgroundRoamingContainer} ref={containerRef}>
      {backgroundAgents.map(agent => (
        <div
          key={agent.id}
          className={styles.backgroundRoamingAgent}
          style={{
            left: `${agent.x - agent.radius}px`,
            top: `${agent.y - agent.radius}px`,
            width: `${AGENT_SIZE}px`,
            height: `${AGENT_SIZE}px`,
            transform: `rotate(${agent.rotation}deg)`,
          }}
        >
          <img
            src={agent.image}
            alt="background agent"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ))}
    </div>
  );
}

function GravityHomepage({ onStartTest }: { onStartTest: () => void }) {
  const AGENT_SIZE = 120;
  const AGENT_RADIUS = AGENT_SIZE / 2;
  const COLLISION_RADIUS = AGENT_SIZE * 0.42; // Balanced collision radius for realistic contact
  const SPEED = 0.2;
  
  // Mini roaming agents constants
  const MINI_FRAME_WIDTH = 400;
  const MINI_FRAME_HEIGHT = 180;
  const MINI_SPEED = 0.3;
  
  // Text collision areas (centered on screen)
  const getTextCollisionBoxes = (): CollisionBox[] => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    return [
      // Title area (expanded and repositioned)
      { x: centerX - 400, y: centerY - 100, width: 800, height: 80 },
      // Description area  
      { x: centerX - 350, y: centerY - 10, width: 700, height: 60 },
      // Button area
      { x: centerX - 120, y: centerY + 60, width: 240, height: 60 }
    ];
  };
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [agents, setAgents] = useState<RoamingAgent[]>([]);

  // Drag state management
  const [draggedAgentId, setDraggedAgentId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Preload the pop sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    try {
      audioRef.current = new Audio('/images/agents/pop.mp3');
      audioRef.current.volume = 0.6;
      audioRef.current.preload = 'auto';
      console.log('Pop.mp3 preloaded successfully');
    } catch (e) {
      console.log('Audio preload failed:', e);
    }
  }, []);

  // Initialize agents with random positions and velocities
  useEffect(() => {
    const initializeAgents = () => {
      // Use window dimensions for full screen coverage
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Mobile detection and agent count optimization
      const isMobile = containerWidth <= 768;
      const maxAgents = isMobile ? 10 : AGENT_IMAGES.length; // 10 on mobile, 32 on desktop
      
      // Button area avoidance (center area where content is)
      const buttonAreaTop = containerHeight * 0.35; // Approximate top of centered content
      const buttonAreaBottom = containerHeight * 0.65; // Approximate bottom of centered content
      const buttonAreaLeft = Math.max(0, (containerWidth - 600) / 2 - 50); // Content max-width 600px + buffer
      const buttonAreaRight = Math.min(containerWidth, (containerWidth + 600) / 2 + 50);
      
      console.log('Initializing agents:', {
        dimensions: `${containerWidth}x${containerHeight}`,
        isMobile,
        agentCount: maxAgents,
        buttonArea: { top: buttonAreaTop, bottom: buttonAreaBottom, left: buttonAreaLeft, right: buttonAreaRight }
      });

      const selectedImages = AGENT_IMAGES.slice(0, maxAgents); // Take only the needed amount
      const initialAgents: RoamingAgent[] = selectedImages.map((image, index) => {
        // Generate random positions avoiding the button area
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
          x = AGENT_RADIUS + Math.random() * (containerWidth - 2 * AGENT_RADIUS);
          y = AGENT_RADIUS + Math.random() * (containerHeight - 2 * AGENT_RADIUS);
          attempts++;
        } while (
          attempts < maxAttempts &&
          x >= buttonAreaLeft && 
          x <= buttonAreaRight && 
          y >= buttonAreaTop && 
          y <= buttonAreaBottom
        );
        
        // If we couldn't find a spot outside the button area after many attempts,
        // force placement in safe zones (top/bottom areas)
        if (attempts >= maxAttempts) {
          x = AGENT_RADIUS + Math.random() * (containerWidth - 2 * AGENT_RADIUS);
          y = Math.random() < 0.5 
            ? AGENT_RADIUS + Math.random() * (buttonAreaTop - AGENT_RADIUS) // Top area
            : (buttonAreaBottom + AGENT_RADIUS) + Math.random() * (containerHeight - buttonAreaBottom - 2 * AGENT_RADIUS); // Bottom area
        }

        return {
          id: `${index}`,
          image,
          x,
          y,
          vx: (Math.random() - 0.5) * SPEED * 2,
          vy: (Math.random() - 0.5) * SPEED * 2,
          radius: COLLISION_RADIUS, // Use smaller radius for collision detection
          rotation: Math.random() * 360,
          hasAppeared: false,
          appearDelay: (index * 10000) / maxAgents, // Spread evenly across 10 seconds based on actual agent count
          isHovered: false,
          isDragging: false,
          isStationary: false,
          dragStartX: 0,
          dragStartY: 0,
          lastX: x,
          lastY: y,
          appearProgress: 0,
          appearStartTime: 0,
        };
      });

      setAgents(initialAgents);
    
    // Start the pop-in animation sequence
    initialAgents.forEach((agent, index) => {
      setTimeout(() => {
        setAgents(currentAgents => 
          currentAgents.map(a => 
            a.id === agent.id ? { ...a, hasAppeared: true, appearStartTime: Date.now() } : a
          )
        );
        
        // Audio disabled - was too annoying with multiple agents
        // if (audioRef.current) {
        //   try {
        //     console.log('Playing pop sound for agent:', agent.id);
        //     audioRef.current.currentTime = 0; // Reset to beginning
        //     audioRef.current.play()
        //       .then(() => console.log('Pop sound played successfully'))
        //       .catch(e => {
        //         console.log('Audio play failed:', e);
        //         if (e.name === 'NotAllowedError') {
        //           console.log('Audio blocked by browser - user interaction required');
        //         }
        //       });
        //   } catch (e) {
        //     console.log('Audio play failed:', e);
        //   }
        // }
        
        // Each agent starts roaming immediately after appearing
      }, agent.appearDelay);
    });
    };

    // Add a small delay to ensure the component is fully rendered
    const timer = setTimeout(initializeAgents, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Animation loop
  useEffect(() => {
    if (agents.length === 0) return;

    const animate = () => {
      // Use current window dimensions for wall bouncing
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Debug: log dimensions occasionally
      if (Math.random() < 0.001) { // Log roughly every 1000 frames
        console.log('Animation dimensions:', containerWidth, 'x', containerHeight);
      }

      setAgents(currentAgents => {
        const newAgents = [...currentAgents];

        // Update positions and rotation for all agents
        newAgents.forEach(agent => {
          // Always update rotation for visual consistency (even before appearing), but not while dragging
          if (!agent.isDragging) {
            agent.rotation += 0.3; // Slower continuous rotation
          }

          // Update pop-in animation progress for appeared agents
          if (agent.hasAppeared && agent.appearStartTime > 0) {
            const elapsed = Date.now() - agent.appearStartTime;
            const duration = 600; // 0.6s animation
            agent.appearProgress = Math.min(elapsed / duration, 1);
          }
          
          // Only update position for agents that have appeared and are not stationary
          if (!agent.hasAppeared || agent.isStationary || agent.isDragging) return; // Skip movement for agents that haven't popped in yet or are being interacted with
          
          // Update position
          agent.x += agent.vx;
          agent.y += agent.vy;

          // Strict boundary enforcement - bounce off walls (use full agent radius for wall collision)
          // Left wall
          if (agent.x - AGENT_RADIUS <= 0) {
            agent.x = AGENT_RADIUS;
            agent.vx = Math.abs(agent.vx); // Force positive velocity (move right)
          }
          // Right wall
          if (agent.x + AGENT_RADIUS >= containerWidth) {
            agent.x = containerWidth - AGENT_RADIUS;
            agent.vx = -Math.abs(agent.vx); // Force negative velocity (move left)
          }
          // Top wall
          if (agent.y - AGENT_RADIUS <= 0) {
            agent.y = AGENT_RADIUS;
            agent.vy = Math.abs(agent.vy); // Force positive velocity (move down)
          }
          // Bottom wall
          if (agent.y + AGENT_RADIUS >= containerHeight) {
            agent.y = containerHeight - AGENT_RADIUS;
            agent.vy = -Math.abs(agent.vy); // Force negative velocity (move up)
          }

          // Button area avoidance (only on mobile and when close to button area)
          const isMobile = containerWidth <= 768;
          if (isMobile) {
            const buttonAreaTop = containerHeight * 0.35;
            const buttonAreaBottom = containerHeight * 0.65;
            const buttonAreaLeft = Math.max(0, (containerWidth - 600) / 2 - 50);
            const buttonAreaRight = Math.min(containerWidth, (containerWidth + 600) / 2 + 50);
            
            // Check if agent is entering button area and redirect it
            if (agent.x + AGENT_RADIUS >= buttonAreaLeft && 
                agent.x - AGENT_RADIUS <= buttonAreaRight && 
                agent.y + AGENT_RADIUS >= buttonAreaTop && 
                agent.y - AGENT_RADIUS <= buttonAreaBottom) {
              
              // Push agent away from button area center
              const centerX = (buttonAreaLeft + buttonAreaRight) / 2;
              const centerY = (buttonAreaTop + buttonAreaBottom) / 2;
              
              // Calculate direction away from center
              const deltaX = agent.x - centerX;
              const deltaY = agent.y - centerY;
              
              // If agent is too close to center, give it a random direction
              if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                agent.vx = (Math.random() - 0.5) * SPEED * 2;
                agent.vy = (Math.random() - 0.5) * SPEED * 2;
              } else {
                // Redirect velocity away from button area
                const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                agent.vx = (deltaX / length) * SPEED;
                agent.vy = (deltaY / length) * SPEED;
              }
            }
          }

          // Check collision with text areas
          const textBoxes = getTextCollisionBoxes();
          textBoxes.forEach(box => {
            // Find closest point on rectangle to circle center
            const closestX = Math.max(box.x, Math.min(agent.x, box.x + box.width));
            const closestY = Math.max(box.y, Math.min(agent.y, box.y + box.height));
            
            // Calculate distance from circle center to closest point
            const dx = agent.x - closestX;
            const dy = agent.y - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if collision occurred
            if (distance < agent.radius) {
              // Calculate bounce direction
              if (distance === 0) {
                // Agent is exactly on edge, push away from center of box
                const boxCenterX = box.x + box.width / 2;
                const boxCenterY = box.y + box.height / 2;
                const pushX = agent.x - boxCenterX;
                const pushY = agent.y - boxCenterY;
                const pushDistance = Math.sqrt(pushX * pushX + pushY * pushY);
                
                if (pushDistance > 0) {
                  agent.vx = (pushX / pushDistance) * SPEED;
                  agent.vy = (pushY / pushDistance) * SPEED;
                }
              } else {
                // Normal bounce off the collision point
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                // Reflect velocity
                const dotProduct = agent.vx * normalX + agent.vy * normalY;
                agent.vx = agent.vx - 2 * dotProduct * normalX;
                agent.vy = agent.vy - 2 * dotProduct * normalY;
                
                // Push agent away from collision
                const pushDistance = agent.radius - distance;
                agent.x += normalX * pushDistance;
                agent.y += normalY * pushDistance;
              }
            }
          });
        });

        // Check collisions between agents (only those that have appeared)
        for (let i = 0; i < newAgents.length; i++) {
          for (let j = i + 1; j < newAgents.length; j++) {
            const agent1 = newAgents[i];
            const agent2 = newAgents[j];
            
            if (!agent1.hasAppeared || !agent2.hasAppeared) continue; // Skip hidden agents

            const dx = agent2.x - agent1.x;
            const dy = agent2.y - agent1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = agent1.radius + agent2.radius;

            if (distance < minDistance) {
              // Collision detected - redirect both agents
              const angle1 = Math.random() * 2 * Math.PI;
              const angle2 = Math.random() * 2 * Math.PI;

              agent1.vx = Math.cos(angle1) * SPEED;
              agent1.vy = Math.sin(angle1) * SPEED;
              agent2.vx = Math.cos(angle2) * SPEED;
              agent2.vy = Math.sin(angle2) * SPEED;

              // Separate agents to prevent overlap
              const overlap = minDistance - distance;
              const separationX = (dx / distance) * (overlap / 2);
              const separationY = (dy / distance) * (overlap / 2);

              agent1.x -= separationX;
              agent1.y -= separationY;
              agent2.x += separationX;
              agent2.y += separationY;
            }
          }
        }



        return newAgents;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [agents.length]);

  // Mouse event handlers for interactivity
  const handleAgentMouseEnter = (agentId: string) => {
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === agentId 
          ? { ...agent, isHovered: true }
          : agent
      )
    );
  };

  const handleAgentMouseLeave = (agentId: string) => {
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === agentId 
          ? { ...agent, isHovered: false }
          : agent
      )
    );
  };

  const handleAgentMouseDown = (e: React.MouseEvent, agentId: string) => {
    e.preventDefault();
    console.log('Mouse down on agent:', agentId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    console.log('Starting drag at:', { mouseX, mouseY });
    setDraggedAgentId(agentId);
    setDragStartTime(Date.now());
    setDragStartPos({ x: mouseX, y: mouseY });
    setMousePos({ x: mouseX, y: mouseY });

    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === agentId 
          ? { 
              ...agent, 
              isDragging: true, 
              isStationary: true,
              dragStartX: mouseX,
              dragStartY: mouseY,
              lastX: agent.x,
              lastY: agent.y
            }
          : agent
      )
    );
  };

  // Global mouse event handlers for dragging - using refs for stable references
  const draggedAgentIdRef = useRef<string | null>(null);
  const dragStartTimeRef = useRef<number>(0);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update refs when state changes
  useEffect(() => {
    draggedAgentIdRef.current = draggedAgentId;
  }, [draggedAgentId]);

  useEffect(() => {
    dragStartTimeRef.current = dragStartTime;
  }, [dragStartTime]);

  useEffect(() => {
    dragStartPosRef.current = dragStartPos;
  }, [dragStartPos]);

  // Set up global mouse event listeners once
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentDraggedId = draggedAgentIdRef.current;
      if (!currentDraggedId || !canvasRef.current) return;

      e.preventDefault(); // Prevent any default behaviors
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setMousePos({ x: mouseX, y: mouseY });

      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === currentDraggedId 
            ? { ...agent, x: mouseX, y: mouseY, lastX: agent.x, lastY: agent.y }
            : agent
        )
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      const currentDraggedId = draggedAgentIdRef.current;
      console.log('🔴 MOUSEUP EVENT FIRED!', { 
        currentDraggedId, 
        eventType: e.type,
        timeStamp: e.timeStamp,
        button: e.button,
        buttons: e.buttons 
      });
      
      if (!currentDraggedId) {
        console.log('🟡 No dragged agent, ignoring mouseup');
        return;
      }

      e.preventDefault(); // Prevent any default behaviors
      e.stopPropagation(); // Stop event bubbling

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        console.log('🟡 No canvas rect, aborting');
        return;
      }

      const currentMouseX = e.clientX - rect.left;
      const currentMouseY = e.clientY - rect.top;

      const dragEndTime = Date.now();
      const dragDuration = Math.max(dragEndTime - dragStartTimeRef.current, 16);
      const dragDistance = Math.sqrt(
        Math.pow(currentMouseX - dragStartPosRef.current.x, 2) + 
        Math.pow(currentMouseY - dragStartPosRef.current.y, 2)
      );

      console.log('🎯 Toss calculation:', { 
        dragDistance, 
        dragDuration, 
        startPos: dragStartPosRef.current,
        endPos: { x: currentMouseX, y: currentMouseY }
      });

      // Calculate toss velocity
      const velocityMultiplier = Math.min(dragDistance / dragDuration * 2, 3);
      const angle = Math.atan2(
        currentMouseY - dragStartPosRef.current.y, 
        currentMouseX - dragStartPosRef.current.x
      );

      const tossVx = Math.cos(angle) * velocityMultiplier;
      const tossVy = Math.sin(angle) * velocityMultiplier;

      console.log('🚀 Calculated toss velocity:', { tossVx, tossVy, velocityMultiplier, angle });

      // Update agent state immediately
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === currentDraggedId 
            ? { 
                ...agent, 
                isDragging: false, 
                isStationary: false,
                isHovered: false,
                vx: tossVx,
                vy: tossVy
              }
            : agent
        )
      );

      // Clear drag state immediately
      setDraggedAgentId(null);
      draggedAgentIdRef.current = null; // Clear ref immediately too
      console.log('✅ Drag state cleared immediately');
    };

    // Force-release function for edge cases
    const forceRelease = (reason: string) => {
      const currentDraggedId = draggedAgentIdRef.current;
      if (currentDraggedId) {
        console.log(`🚨 FORCE RELEASE: ${reason}`);
        setAgents(prevAgents => 
          prevAgents.map(agent => 
            agent.id === currentDraggedId 
              ? { 
                  ...agent, 
                  isDragging: false, 
                  isStationary: false,
                  isHovered: false,
                  vx: 0, // No velocity for force release
                  vy: 0
                }
              : agent
          )
        );
        setDraggedAgentId(null);
        draggedAgentIdRef.current = null;
      }
    };

    // Handle lost focus or mouse leaving window
    const handleVisibilityChange = () => {
      if (document.hidden) {
        forceRelease('document hidden');
      }
    };

    const handleMouseLeave = () => {
      forceRelease('mouse left window');
    };

    const handleBlur = () => {
      forceRelease('window lost focus');
    };

    // Add multiple event listeners for robust detection
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    // Also listen for mouseup on window (sometimes document misses it)
    window.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    console.log('🔧 ALL mouse event listeners added (document + window)');

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mouseup', handleMouseUp);
      console.log('🔧 ALL mouse event listeners removed');
    };
  }, []); // Empty dependency array - listeners are always active

  // Calculate pop-in scale based on animation progress
  const getPopInScale = (agent: RoamingAgent): number => {
    if (!agent.hasAppeared) {
      return 0.8; // Hidden state
    }
    
    if (agent.appearProgress >= 1) {
      return 1; // Finished animation
    }
    
    // Recreate the pop-in curve: 0.8 -> 1.1 -> 1.0
    const progress = agent.appearProgress;
    if (progress <= 0.5) {
      // First half: 0.8 to 1.1 (difference of 0.3)
      return 0.8 + (progress * 2) * 0.3;
    } else {
      // Second half: 1.1 to 1.0 (difference of -0.1)
      return 1.1 + ((progress - 0.5) * 2) * (-0.1);
    }
  };
  
  return (
    <div className={styles.roamingContainer} ref={canvasRef}>
      {/* Roaming agents */}
      {agents.map(agent => (
        <div
          key={agent.id}
          className={styles.roamingAgent}
          style={{
            left: agent.x - agent.radius,
            top: agent.y - agent.radius,
            width: AGENT_SIZE,
            height: AGENT_SIZE,
            transform: `rotate(${agent.rotation}deg) scale(${getPopInScale(agent) * (agent.isHovered || agent.isDragging ? 1.05 : 1)})`,
            cursor: agent.isHovered || agent.isDragging ? 'grabbing' : 'grab',
            zIndex: agent.isDragging ? 1000 : 10,
            opacity: agent.hasAppeared ? 1 : 0,
          }}
          onMouseEnter={() => handleAgentMouseEnter(agent.id)}
          onMouseLeave={() => handleAgentMouseLeave(agent.id)}
          onMouseDown={(e) => handleAgentMouseDown(e, agent.id)}
        >
          <img
            src={`/images/agents/${agent.image}`}
            alt={agent.image}
                />
              </div>
      ))}

      {/* Overlay content */}
      <div className={styles.roamingOverlay}>
        <div 
          className={styles.roamingContent}
        >
          <h1 className={styles.title}>
            What Notion <span className={styles.titleBreak}>Agent Are You?</span>
          </h1>
          <p className={styles.description}>
            Answer 11 questions to reveal what Notion agent<span className={styles.desktopBreak}><br /></span> aligns most closely with your personality.
          </p>
          <button className={styles.getStartedButton} onClick={onStartTest}>
            Get Started →
        </button>
      </div>
            </div>
    </div>
  );
} 