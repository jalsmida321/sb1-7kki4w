import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Box, Button, VStack, Image, Input } from '@chakra-ui/react';

const FRUITS = [
  { radius: 15, score: 1 },
  { radius: 20, score: 2 },
  { radius: 25, score: 3 },
  { radius: 35, score: 4 },
  { radius: 40, score: 5 },
  { radius: 50, score: 6 },
  { radius: 60, score: 7 },
  { radius: 70, score: 8 },
  { radius: 80, score: 9 },
  { radius: 90, score: 10 },
];

const Game: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const [customImages, setCustomImages] = useState<string[]>(Array(10).fill(''));
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!boxRef.current || !canvasRef.current) return;

    const engine = engineRef.current;
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 400,
        height: 600,
        wireframes: false,
        background: '#f0f0f0'
      }
    });

    const world = engine.world;

    // Walls
    const walls = [
      Matter.Bodies.rectangle(200, 610, 400, 20, { isStatic: true }),
      Matter.Bodies.rectangle(-10, 300, 20, 600, { isStatic: true }),
      Matter.Bodies.rectangle(410, 300, 20, 600, { isStatic: true })
    ];
    Matter.World.add(world, walls);

    // Game loop
    Matter.Runner.run(engine);
    Matter.Render.run(render);

    // Collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (bodyA.circleRadius === bodyB.circleRadius) {
          const index = FRUITS.findIndex(f => f.radius === bodyA.circleRadius);
          if (index < FRUITS.length - 1) {
            const newFruit = createFruit(
              (bodyA.position.x + bodyB.position.x) / 2,
              (bodyA.position.y + bodyB.position.y) / 2,
              index + 1
            );
            Matter.World.remove(world, [bodyA, bodyB]);
            Matter.World.add(world, newFruit);
            setScore(prev => prev + FRUITS[index].score);
          }
        }
      });
    });

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  const createFruit = (x: number, y: number, index: number) => {
    const fruit = Matter.Bodies.circle(x, y, FRUITS[index].radius, {
      restitution: 0.5,
      render: {
        sprite: {
          texture: customImages[index] || `fruit${index}.png`,
          xScale: 1,
          yScale: 1
        }
      }
    });
    return fruit;
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fruit = createFruit(x, 50, 0);
    Matter.World.add(engineRef.current.world, fruit);
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImages = [...customImages];
        newImages[index] = e.target?.result as string;
        setCustomImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateShareLink = () => {
    const gameState = {
      customImages,
      score
    };
    const encoded = btoa(JSON.stringify(gameState));
    return `${window.location.origin}?game=${encoded}`;
  };

  return (
    <VStack spacing={4} align="center">
      <Box
        ref={boxRef}
        w="400px"
        h="600px"
        border="2px solid black"
        position="relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <canvas ref={canvasRef} />
      </Box>
      
      <Box>Score: {score}</Box>
      
      <VStack spacing={2}>
        {FRUITS.map((_, index) => (
          <Input
            key={index}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(index, e)}
          />
        ))}
      </VStack>
      
      <Button
        onClick={() => {
          const link = generateShareLink();
          navigator.clipboard.writeText(link);
          alert('Share link copied to clipboard!');
        }}
      >
        Share Game
      </Button>
    </VStack>
  );
};

export default Game;