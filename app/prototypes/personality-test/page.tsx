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

function GravityHomepage({ onStartTest }: { onStartTest: () => void }) {
  const AGENT_SIZE = 120;
  const AGENT_RADIUS = AGENT_SIZE / 2;
  const COLLISION_RADIUS = AGENT_SIZE * 0.42; // Balanced collision radius for realistic contact
  const SPEED = 0.2;
  
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
      
      console.log('Initializing agents with dimensions:', containerWidth, 'x', containerHeight);

      const initialAgents: RoamingAgent[] = AGENT_IMAGES.map((image, index) => {
        // Generate random positions across the full screen (use full radius for positioning)
        const x = AGENT_RADIUS + Math.random() * (containerWidth - 2 * AGENT_RADIUS);
        const y = AGENT_RADIUS + Math.random() * (containerHeight - 2 * AGENT_RADIUS);

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
          appearDelay: (index * 10000) / AGENT_IMAGES.length, // Spread evenly across 10 seconds
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
          <h1 className={styles.title}>What Notion Agent are you?</h1>
          <p className={styles.description}>
            Take our personality test to discover which Notion agent matches your work style and preferences.
          </p>
          <button className={styles.getStartedButton} onClick={onStartTest}>
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}

const questions: Question[] = [
  {
    text: "Do you work to live or live to work?",
    answers: [
      { text: "Work to live", value: "L" },
      { text: "Live to work", value: "W" }
    ]
  },
  {
    text: "My ideal day:",
    answers: [
      { image: "/images/agents/2A.png", value: "I" },
      { image: "/images/agents/2B.png", value: "T" }
    ]
  },
  {
    text: "What does your inbox look like?",
    answers: [
      { image: "/images/agents/3a.png", value: "S" },
      { image: "/images/agents/3b.png", value: "U" }
    ]
  },
  {
    text: "What templates are you interested in?",
    answers: [
      { image: "/images/agents/4a.png", value: "A" },
      { image: "/images/agents/4b.png", value: "C" }
    ]
  },
  {
    text: "Do you prefer to take the lead and prioritize outcomes or cooperate and maintain harmony?",
    answers: [
      { text: "Prioritize outcomes", value: "D" },
      { text: "Prioritize harmony", value: "Y" }
    ]
  }
];

const agents: { [key: string]: AgentProfile } = {
  "WTUAD": {
    name: "Lightbulb",
    image: "lightbulb.png",
    strengths: [
      "The ultimate idea generator - innovation is their middle name",
      "Thrives in chaotic, unstructured environments where others get lost",
      "Can see the big picture and connect abstract concepts like magic"
    ],
    weaknesses: [
      "Hundreds of tabs open and proud of it",
      "Has strong opinions about everything but forgets what they argued yesterday",
      "Can't resist adding 'just one more feature' that completely changes everything"
    ]
  },
  "WTUAY": {
    name: "Scribble",
    image: "scribble.png",
    strengths: [
      "Creative chaos master - turns messy brainstorms into breakthrough ideas",
      "Thrives in unstructured environments where others get lost",
      "Amazing at building team consensus around innovative concepts"
    ],
    weaknesses: [
      "Starts more projects than humanly possible to finish",
      "Gets excited about every new idea and forgets the old ones",
      "Avoids making tough decisions that might hurt feelings"
    ]
  },
  "WTUCD": {
    name: "Bell",
    strengths: [
      "Always knows what's trending before it's cool",
      "Excellent at reading the room and adapting to team dynamics",
      "Can take abstract ideas and make them practical"
    ],
    weaknesses: [
      "Gets distracted by shiny new things",
      "Sometimes sacrifices depth for breadth", 
      "FOMO is their middle name"
    ]
  },
  "WTUCY": {
    name: "Clippy",
    strengths: [
      "Always ready to help, even when you don't ask",
      "Great at taking messy situations and finding practical solutions",
      "Builds harmony while still getting concrete results"
    ],
    weaknesses: [
      "Can be a little too helpful sometimes",
      "Sometimes avoids taking charge when leadership is needed",
      "Has strong opinions about font choices"
    ]
  },
  "WTSAD": {
    name: "Single Arrow",
    strengths: [
      "Finishes three things while others are still arguing about what to have for lunch",
      "Can spot the actual problem in a room full of people discussing symptoms",
      "Turns your random 3 AM idea into reality before your morning coffee gets cold"
    ],
    weaknesses: [
      "Gets a visible eye twitch when plans change or meetings run over",
      "Has an allergic reaction to team bonding activities and trust falls",
      "Will accidentally bulldoze through feelings like they're made of tissue paper"
    ]
  },
  "WTSAY": {
    name: "Repeat Cycle",
    strengths: [
      "Masters of creating efficient, repeatable processes",
      "Great at building team alignment around structured approaches",
      "Excellent at balancing big-picture thinking with practical execution"
    ],
    weaknesses: [
      "Gets stressed when plans change or structure breaks down",
      "Can be overly cautious about taking decisive action",
      "Sometimes gets stuck perfecting the process instead of shipping"
    ]
  },
  "WTSCY": {
    name: "Notetaker",
    image: "notetaker.png",
    strengths: [
      "Never misses a detail - the human version of meeting minutes",
      "Creates structured systems that help teams stay organized",
      "Builds consensus by making sure everyone's voice is documented"
    ],
    weaknesses: [
      "Takes notes on their note-taking process",
      "Sometimes gets stuck documenting instead of doing",
      "Avoids tough decisions that might disrupt team harmony"
    ]
  },
  "WTSCD": {
    name: "Gear",
    strengths: [
      "Incredible at building robust systems that actually work",
      "Great at seeing both the abstract design and concrete implementation",
      "Takes charge of complex projects and drives them to completion"
    ],
    weaknesses: [
      "Gets frustrated when team doesn't follow established processes",
      "Can be inflexible when 'good enough' would be better than perfect",
      "Sometimes bulldozes through team input in favor of efficiency"
    ]
  },
  "WISCD": {
    name: "Time Schedule",
    strengths: [
      "Always prepared, the type of person who packs snacks for a 20-minute drive",
      "Can turn your wildest dreams into a perfectly color-coded spreadsheet",
      "Has backup plans for their backup plans"
    ],
    weaknesses: [
      "Panics when someone shows up 3 minutes late to a meeting",
      "Gets lost in the details and misses that the building is on fire",
      "Will create a 12-step plan for making a sandwich"
    ]
  },
  "WISCY": {
    name: "Brackets",
    strengths: [
      "The human equivalent of a Swiss Army knife - has a tool for everything",
      "Can get everyone on the same page even when they're reading different books",
      "Makes boring processes actually fun somehow"
    ],
    weaknesses: [
      "Breaks down when there's no instruction manual",
      "Gets the group chat anxiety when people start arguing",
      "Would rather eat pineapple pizza than make someone upset"
    ]
  },
  "WISAD": {
    name: "Formula",
    strengths: [
      "Can solve anything with the right equation and enough coffee",
      "Turns abstract chaos into step-by-step instructions",
      "Gets stuff done while others are still arguing about the font"
    ],
    weaknesses: [
      "Dies a little inside when people don't follow the clearly labeled steps",
      "Has zero patience for 'but what if we tried this random thing instead?'",
      "Sometimes forgets that humans aren't spreadsheet cells"
    ]
  },
  "WISAY": {
    name: "Root",
    strengths: [
      "Deep thinker who creates solid foundations for complex projects",
      "Great at building structured approaches to abstract problems",
      "Excellent at consensus-building around thoughtful solutions"
    ],
    weaknesses: [
      "Can overthink decisions and delay action",
      "Gets paralyzed when structure breaks down or plans change",
      "Sometimes gets stuck in analysis mode instead of executing"
    ]
  },
  "WIUAD": {
    name: "Infinity Glasses",
    strengths: [
      "Thrives in chaotic environments where others get overwhelmed",
      "Amazing at connecting abstract concepts across different domains",
      "Natural leader who can rally people around big, ambitious visions"
    ],
    weaknesses: [
      "Can get lost in theoretical possibilities without concrete action",
      "Gets frustrated with detailed implementation and practical constraints",
      "Sometimes bulldozes through team input when excited about an idea"
    ]
  },
  "WIUAY": {
    name: "Math",
    strengths: [
      "Can see the forest, the trees, and somehow also the squirrels",
      "Can connect your childhood trauma to your Netflix algorithm",
      "Can make anyone understand anything using the right analogy"
    ],
    weaknesses: [
      "Falls into rabbit holes and emerges three hours later having learned about medieval farming",
      "Would rather debate the theory than actually pick something and go with it",
      "Would rather build the perfect system than use the imperfect one that exists"
    ]
  },
  "WIUCD": {
    name: "Research",
    strengths: [
      "Knows the answer to everything... eventually",
      "Can find connections between the most random topics",
      "Makes order out of chaos when everyone else is lost"
    ],
    weaknesses: [
      "Goes down rabbit holes and forgets what the original question was",
      "Gets cranky when people want answers faster than Google can provide them",
      "Has 47 browser tabs open and somehow that's 'organized'"
    ]
  },
  "WIUCY": {
    name: "Book Wiki",
    image: "book-wiki.png",
    strengths: [
      "Walking encyclopedia who somehow makes learning fun",
      "Amazing at connecting random facts into breakthrough insights",
      "Builds consensus by helping everyone understand the 'why'"
    ],
    weaknesses: [
      "Falls down Wikipedia rabbit holes instead of making decisions",
      "Can be indecisive when the team needs quick action",
      "Gets overwhelmed when there's no clear research path"
    ]
  },
  "LIUAD": {
    name: "Spiky",
    strengths: [
      "Brings fresh energy to stale projects and processes",
      "Amazing at working independently in chaotic, unstructured environments",
      "Great at taking big abstract visions and running with them"
    ],
    weaknesses: [
      "Can be impatient with team coordination and consensus-building",
      "Sometimes bulldozes through without considering practical constraints",
      "Gets frustrated when forced into structured processes"
    ]
  },
  "LIUAY": {
    name: "Single Loop",
    strengths: [
      "Excellent at working independently while building team consensus",
      "Great at finding creative solutions in ambiguous situations",
      "Brings calm, thoughtful energy to chaotic projects"
    ],
    weaknesses: [
      "Can get stuck in endless exploration and refinement cycles",
      "Sometimes avoids making tough decisions that might upset people",
      "Gets overwhelmed when forced into rigid timelines or processes"
    ]
  },
  "LIUCD": {
    name: "Cactus",
    image: "cactus.png",
    strengths: [
      "Intimidating but secretly soft",
      "Can make any group stop overthinking by asking 'but what are we actually going to do?'",
      "Has mastered the art of being helpful without enabling helplessness"
    ],
    weaknesses: [
      "Has a bad habit of laughing at the wrong moments",
      "Will be a little too honest in your perf review",
      "Has a habit of disappearing onto random side quests at the worst moments"
    ]
  },
  "LIUCY": {
    name: "Saucy",
    image: "saucy.png",
    strengths: [
      "Adds flavor to boring projects and spices up team dynamics", 
      "Great at finding creative solutions in messy situations",
      "Perfect balance of independence and collaborative spirit"
    ],
    weaknesses: [
      "Can be a little too spicy when projects get bland",
      "Would rather wing it than follow a recipe, even when the recipe actually works",
      "Gets frustrated when forced into rigid, tasteless processes"
    ]
  },
  "LTUAD": {
    name: "Heart",
    strengths: [
      "Shows up to your crisis with homemade soup and a vision board",
      "Can rally people around a cause they just made up five minutes ago",
      "Has mastered the art of meaningful eye contact without being creepy"
    ],
    weaknesses: [
      "Cries easily",
      "Treats every coincidence like it's a message meant specifically for them",
      "Sometimes mistakes intensity for intimacy and scares people away"
    ]
  },
  "LTUAY": {
    name: "Cloud Flower",
    strengths: [
      "Can defuse any argument by asking if anyone wants herbal tea",
      "Has perfected the art of saying 'that's interesting' in a way that makes people feel heard",
      "Can make any harsh fluorescent lighting feel softer just by being there"
    ],
    weaknesses: [
      "Won't be able to write down anything critical on your perf review. Except maybe \"Works too hard!!\"",
      "Takes personal responsibility for every awkward pause in group conversations",
      "Can't give directions without including emotional landmarks like 'turn left at where I had my first heartbreak'"
    ]
  },
  "LTUCD": {
    name: "Command",
    strengths: [
      "Excellent at taking charge of chaotic team situations",
      "Great at turning abstract visions into concrete action plans",
      "Can rally teams around practical solutions under pressure"
    ],
    weaknesses: [
      "Can be impatient with team members who need more structure",
      "Sometimes bulldozes through without considering all perspectives",
      "Gets frustrated when projects become too abstract or theoretical"
    ]
  },
  "LTUCY": {
    name: "Banana",
    strengths: [
      "Can turn any struggle into quality comedic content and unhinged slack emojis",
      "Always knows the perfect question to ask to get people talking",
      "Can sense when someone needs a hug and somehow makes it not weird"
    ],
    weaknesses: [
      "Sometimes takes a joke too far and overthinks it for weeks",
      "Takes it as a personal failure when group chemistry just isn't working",
      "Has never won an argument because they always see everyone's point"
    ]
  },
  "LTSAD": {
    name: "Book",
    image: "book.png",
    strengths: [
      "Creates well-structured knowledge systems that teams actually use",
      "Great at taking abstract concepts and organizing them into actionable plans",
      "Natural leader who guides teams through complex information"
    ],
    weaknesses: [
      "Can get frustrated when team doesn't follow their organized approach",
      "Sometimes prioritizes getting it right over getting it done",
      "Gets impatient when discussions become too theoretical"
    ]
  },
  "LTSAY": {
    name: "Music",
    image: "music.png",
    strengths: [
      "Perfect at orchestrating team harmony around structured approaches",
      "Great at finding the rhythm between big-picture vision and execution",
      "Excellent at creating melodious collaboration between different personalities"
    ],
    weaknesses: [
      "Can get stuck trying to make everyone sing in perfect harmony",
      "Sometimes avoids discordant decisions that might upset the ensemble",
      "Gets overwhelmed when the tempo changes or the score gets messy"
    ]
  },
  "LTSCD": {
    name: "Phone",
    strengths: [
      "Amazing at coordinating complex team projects with clear structure",
      "Great at turning abstract visions into concrete, actionable plans",
      "Excellent at driving results while maintaining team collaboration"
    ],
    weaknesses: [
      "Can get overwhelmed when managing too many team communications",
      "Sometimes bulldozes through individual concerns for team efficiency",
      "Gets frustrated when projects become too abstract or open-ended"
    ]
  },
  "LTSCY": {
    name: "Double Copy",
    strengths: [
      "Perfect balance of structured planning and team collaboration",
      "Great at creating backup plans and ensuring everyone's prepared",
      "Excellent at building consensus around practical, concrete solutions"
    ],
    weaknesses: [
      "Can get paralyzed trying to plan for every possible scenario",
      "Sometimes avoids making decisions that might upset team harmony",
      "Gets anxious when processes are unclear or timelines are ambiguous"
    ]
  },
  "LISAD": {
    name: "Spiral Notebook/Greek God",
    strengths: [
      "Works best alone and somehow makes it look effortless",
      "Can turn impossible dreams into actual to-do lists",
      "Has main character energy and the skills to back it up"
    ],
    weaknesses: [
      "Group projects make them break out in hives",
      "Gets so caught up in the big picture they forget to eat lunch",
      "Would rather do everything themselves than explain it twice"
    ]
  },
  "LISAY": {
    name: "Umbrella",
    strengths: [
      "Excellent at working independently while building team consensus",
      "Great at creating structured approaches to abstract, complex problems",
      "Perfect balance of thoughtful planning and collaborative execution"
    ],
    weaknesses: [
      "Can get stuck in analysis mode when quick decisions are needed",
      "Sometimes avoids taking strong positions to maintain harmony",
      "Gets overwhelmed when structure breaks down or processes become unclear"
    ]
  },
  "LISCD": {
    name: "Coffee",
    strengths: [
      "Runs on pure energy and somehow makes 6 AM meetings bearable",
      "Can power through any task with enough caffeine and determination",
      "The human equivalent of a motivational poster, but actually useful"
    ],
    weaknesses: [
      "Gets the jitters when too many people want to 'touch base'",
      "Crashes hard after giving everyone else their daily dose of enthusiasm",
      "Needs concrete goals or starts bouncing off the walls"
    ]
  },
  "LISCY": {
    name: "Apple",
    strengths: [
      "The one who always has a tide pen on them",
      "The human equivalent of a really good multivitamin - quietly essential",
      "Great at gentle parenting their friends through their bad life decisions"
    ],
    weaknesses: [
      "Savior complex",
      "Sometimes forgets that not everyone wants to optimize their life",
      "Won't stop cleaning up other people's homes"
    ]
  }
};

interface LeaderboardEntry {
  agent: string;
  count: number;
}

export default function NotionAgentTest() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'test' | 'result'>('landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sequence, setSequence] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const profileCardRef = useRef<HTMLDivElement>(null);

  // Preload images for the next question
  useEffect(() => {
    if (currentStep === 'test' && currentQuestion < questions.length - 1) {
      const nextQuestion = questions[currentQuestion + 1];
      if (nextQuestion.answers.some(answer => answer.image)) {
        nextQuestion.answers.forEach(answer => {
          if (answer.image) {
            const img = new Image();
            img.src = answer.image;
          }
        });
      }
    }
  }, [currentQuestion, currentStep]);

  const getAgentImage = (agentName: string) => {
    // Handle special cases first
    if (agentName === 'Spiral Notebook/Greek God') {
      return '/images/agents/greek-god.png';
    }
    
    // Convert agent name to filename format
    const filename = agentName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace('/', '-');
    return `/images/agents/${filename}.png`;
  };

  const getBinaryChoices = (sequence: string) => {
    const [first, second, third, fourth, fifth] = sequence.split('');
    
    return {
      workLife: first === 'W' ? 'Live to work' : 'Work to live',
      collaboration: second === 'T' ? 'Collaborative' : 'Independent', 
      structure: third === 'S' ? 'Structured' : 'Unstructured',
      thinking: fourth === 'A' ? 'Abstract' : 'Concrete',
      approach: fifth === 'D' ? 'Impact' : 'Harmony'
    };
  };

  const startTest = () => {
    setCurrentStep('test');
    setCurrentQuestion(0);
    setSequence('');
    setSelectedAnswer(null);
    setAnswers({});
  };

  const selectAnswer = (value: string) => {
    setSelectedAnswer(value);
  };

  const nextQuestion = () => {
    if (!selectedAnswer) return;
    
    // Save the current answer
    const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
    setAnswers(newAnswers);
    
    const newSequence = sequence + selectedAnswer;
    setSequence(newSequence);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      // Load the previously selected answer for the next question
      setSelectedAnswer(newAnswers[currentQuestion + 1] || null);
    } else {
      setCurrentStep('result');
      // Save result to backend
      saveResult(newSequence);
    }
  };

  const saveResult = async (finalSequence: string) => {
    try {
      const agent = agents[finalSequence];
      await fetch('/api/personality-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent: agent.name,
          sequence: finalSequence,
        }),
      });
    } catch (error) {
      console.error('Failed to save result:', error);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Remove the last answer from sequence
      setSequence(sequence.slice(0, -1));
      // Load the previously selected answer for the previous question
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    } else {
      // If on question 1, go back to landing page
      setCurrentStep('landing');
      setCurrentQuestion(0);
      setSequence('');
      setSelectedAnswer(null);
      setAnswers({});
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys during the test phase
      if (currentStep !== 'test') return;

      if (event.key === 'ArrowRight' && selectedAnswer) {
        event.preventDefault();
        nextQuestion();
        // Remove focus from any button to prevent highlight
        (document.activeElement as HTMLElement)?.blur();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousQuestion();
        // Remove focus from any button to prevent highlight
        (document.activeElement as HTMLElement)?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, selectedAnswer]);

  const restartTest = () => {
    setCurrentStep('landing');
    setCurrentQuestion(0);
    setSequence('');
    setSelectedAnswer(null);
    setAnswers({});
  };

  const saveAsImage = async () => {
    if (profileCardRef.current) {
      try {
        const canvas = await html2canvas(profileCardRef.current, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `my-notion-agent-${agents[sequence].name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }
  };

  const saveImageOnly = async () => {
    const agent = agents[sequence];
    if (agent) {
      try {
        // Create a temporary image element to capture just the agent image
        const agentImageElement = document.querySelector(`.${styles.agentImage}`) as HTMLImageElement;
        if (agentImageElement) {
          // Create a canvas to draw just the agent image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = 140; // Same as agent image size
          canvas.height = 140;
          
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(agentImageElement, 0, 0, 140, 140);
            
            // Create download link
            const link = document.createElement('a');
            link.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
        }
      } catch (error) {
        console.error('Error generating agent image:', error);
      }
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const response = await fetch('/api/personality-results');
      const data = await response.json();
      if (data.success) {
        setLeaderboardData(data.leaderboard);
        setTotalResults(data.totalResults);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const openLeaderboard = () => {
    setShowLeaderboard(true);
    fetchLeaderboard();
  };

  const closeLeaderboard = () => {
    setShowLeaderboard(false);
  };

  const progress = ((currentQuestion) / questions.length) * 100;

  if (currentStep === 'landing') {
    return (
      <div className={styles.container}>
        <GravityHomepage onStartTest={startTest} />
      </div>
    );
  }

  if (currentStep === 'test') {
    const question = questions[currentQuestion];
    
    return (
      <div className={styles.container}>
        <div className={styles.testContent}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
            <div className={styles.questionNumber}>
            Question {currentQuestion + 1} of {questions.length}
          </div>
          
          <h2 className={styles.question}>{question.text}</h2>
          
          <div className={`${styles.answers} ${question.answers.some(answer => answer.image) ? styles.imageAnswers : ''}`}>
            {question.answers.map((answer, index) => (
              <button
                key={index}
                className={`${styles.answerButton} ${answer.image ? styles.imageAnswer : ''} ${currentQuestion === 3 && answer.image ? styles.question4 : ''} ${selectedAnswer === answer.value ? styles.selected : ''}`}
                onClick={() => selectAnswer(answer.value)}
              >
                {answer.image ? (
                  <img 
                    src={answer.image} 
                    alt={`Option ${index + 1}`} 
                    className={styles.answerImage}
                  />
                ) : (
                  answer.text
                )}
              </button>
            ))}
          </div>
          
          <div className={styles.navigationButtons}>
            <button
              className={styles.backButton}
              onClick={previousQuestion}
            >
              Back
            </button>
            
            <button
              className={`${styles.nextButton} ${selectedAnswer ? styles.enabled : ''}`}
              onClick={nextQuestion}
              disabled={!selectedAnswer}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  const agent = agents[sequence];
  
  return (
    <div className={styles.container}>
      <div className={styles.result}>
        <div className={styles.saveDropdown}>
          <button className={styles.saveButton}>
            Save
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={styles.saveMenu}>
            <button className={styles.saveMenuItem} onClick={saveAsImage}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Results card
            </button>
            <button className={styles.saveMenuItem} onClick={() => saveImageOnly()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="m9,9h0a3,3 0 0,0 6,0h0" stroke="currentColor" strokeWidth="2"/>
                <path d="m9,15a3,3 0 0,0 6,0" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Agent image
            </button>
          </div>
        </div>
        
        <div ref={profileCardRef} className={styles.profileCard}>
          <div className={styles.agentHeaderContainer}>
            <div className={styles.agentHeader}>
              <div className={styles.agentImageContainer}>
                <img 
                  src={getAgentImage(agent.name)} 
                  alt={agent.name}
                  className={styles.agentImage}
                />
              </div>
              <div className={styles.agentInfo}>
                <div className={styles.resultSubtitle}>Your Notion Agent is</div>
                <div className={styles.resultTitle}>{agent.name}</div>
              </div>
            </div>
            <div className={styles.headerDivider}></div>
          </div>
          
          <div className={styles.traitsSection}>
            <div className={styles.traitColumn}>
              <h3 className={styles.traitTitle}>👍 Strengths</h3>
              <ul className={styles.traitList}>
                {agent.strengths.map((strength, index) => (
                  <li key={index} className={styles.traitItem}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.traitColumn}>
              <h3 className={styles.traitTitle}>👎 Weaknesses</h3>
              <ul className={styles.traitList}>
                {agent.weaknesses.map((weakness, index) => (
                  <li key={index} className={styles.traitItem}>{weakness}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.binaryChoices}>
              {(() => {
                const choices = getBinaryChoices(sequence);
                return (
                  <>
                                        <div className={styles.binaryItem}>
                      <span className={styles.binaryLabel}><span className={styles.letterContainer}>ORIENTATION</span></span>
                      <div className={styles.toggleContainer}>
                        <div className={`${styles.toggleOption} ${choices.workLife === 'Work to live' ? styles.active : ''}`}>
                          Work to live
                        </div>
                        <div className={`${styles.toggleOption} ${choices.workLife === 'Live to work' ? styles.active : ''}`}>
                          Live to work
                        </div>
                      </div>
                    </div>
                    <div className={styles.binaryItem}>
                      <span className={styles.binaryLabel}><span className={styles.letterContainer}>COLLABORATION</span></span>
                      <div className={styles.toggleContainer}>
                        <div className={`${styles.toggleOption} ${choices.collaboration === 'Independent' ? styles.active : ''}`}>
                          Independent
                        </div>
                        <div className={`${styles.toggleOption} ${choices.collaboration === 'Collaborative' ? styles.active : ''}`}>
                          Collaborative
                        </div>
                      </div>
                    </div>
                    <div className={styles.binaryItem}>
                      <span className={styles.binaryLabel}><span className={styles.letterContainer}>ORGANIZATION</span></span>
                      <div className={styles.toggleContainer}>
                        <div className={`${styles.toggleOption} ${choices.structure === 'Structured' ? styles.active : ''}`}>
                          Structured
                        </div>
                        <div className={`${styles.toggleOption} ${choices.structure === 'Unstructured' ? styles.active : ''}`}>
                          Unstructured
                        </div>
                      </div>
                    </div>
                    <div className={styles.binaryItem}>
                      <span className={styles.binaryLabel}><span className={styles.letterContainer}>PERCEPTION</span></span>
                                            <div className={styles.toggleContainer}>
                        <div className={`${styles.toggleOption} ${choices.thinking === 'Abstract' ? styles.active : ''}`}>
                          Abstract
                        </div>
                        <div className={`${styles.toggleOption} ${choices.thinking === 'Concrete' ? styles.active : ''}`}>
                          Concrete
                        </div>
                      </div>
                    </div>
                    <div className={styles.binaryItem}>
                      <span className={styles.binaryLabel}><span className={styles.letterContainer}>PRIORITY</span></span>
                      <div className={styles.toggleContainer}>
                        <div className={`${styles.toggleOption} ${choices.approach === 'Impact' ? styles.active : ''}`}>
                          Impact
                        </div>
                        <div className={`${styles.toggleOption} ${choices.approach === 'Harmony' ? styles.active : ''}`}>
                          Harmony
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
        </div>
        
        <button className={styles.fixedRetakeButton} onClick={restartTest}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retake test
        </button>
        
        <button className={styles.leaderboardButton} onClick={openLeaderboard}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12h20" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Leaderboard
        </button>
      </div>
      
      {showLeaderboard && (
        <div className={styles.modalOverlay} onClick={closeLeaderboard}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Results leaderboard</h2>
              <button className={styles.closeButton} onClick={closeLeaderboard}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {isLoadingLeaderboard ? (
                <div className={styles.loading}>Loading leaderboard...</div>
              ) : (
                <>
                  <div className={styles.leaderboardList}>
                    {leaderboardData.map((entry, index) => {
                      const percentage = totalResults > 0 ? ((entry.count / totalResults) * 100).toFixed(1) : '0';
                      return (
                        <div key={entry.agent} className={styles.leaderboardItem}>
                          <div className={styles.rankInfo}>
                            <img 
                              src={getAgentImage(entry.agent)} 
                              alt={entry.agent}
                              className={styles.agentIcon}
                            />
                            <span className={styles.agentName}>{entry.agent}</span>
                          </div>
                          <div className={styles.statsInfo}>
                            <span className={styles.count}>
                              {entry.count} {entry.count === 1 ? 'person' : 'people'}
                            </span>
                            <span className={styles.percentage}>{percentage}%</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className={styles.totalResults}>
                    Total participants: {totalResults}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 