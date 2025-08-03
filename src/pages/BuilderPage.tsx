import {  StepsList } from '../components/StepsList';
import { CodeEditor } from '../components/CodeEditor';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { parseXml } from '../steps';
import { FileItem, Step, StepType } from '../types'; 
import { FileExplorer } from '../components/FileExplorer';
import { useWebContainer } from '../hooks/useWebContainer';
import { useCallback } from 'react';
import { motion } from 'framer-motion';

export function BuilderPage() {

  const location = useLocation();
  const { prompt } = location.state || { prompt: '' };
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const webcontainer = useWebContainer();
   
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {

    let originalFiles = [...files];
    let updateHappened = false;
    
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; 
        let currentFileStructure = [...originalFiles]; 
        const finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          const currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            const file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {

            const folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }
    })
    if (updateHappened) {

      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
        
      }))
    }
    console.log(files);
    console.log(steps);
  }, [steps, files]);



  useEffect(() => {

    type MountFile = {
      file: {
        contents: string;
      };
    };

    type MountDirectory = {
      directory: {
        [key: string]: MountFile | MountDirectory;
      };
    };

    type MountStructure = {
      [key: string]: MountFile | MountDirectory;
    };

    const createMountStructure = (files: FileItem[]): MountStructure => {
      const mountStructure: MountStructure = {};
      
      const processFile = (file: FileItem, isRootFolder: boolean): MountFile | MountDirectory => {  
        if (file.type === 'folder') {
          const dir: MountDirectory = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
          if (isRootFolder) {
            mountStructure[file.name] = dir;
          }
          return dir;
        } else if (file.type === 'file') {
          const fileObj: MountFile = {
            file: {
              contents: file.content || ''
            }
          };
          if (isRootFolder) {
            mountStructure[file.name] = fileObj;
          }
          return fileObj;
        }
        // fallback, should not reach here
        return {} as MountFile;
      };
  
      files.forEach(file => processFile(file, true));
  
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  const init = useCallback(async () => {
    
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
  
    const { prompts, uiPrompts } = response.data;
  
    const parsedSteps = parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: 'pending' as const,
    }));
  
    setSteps(parsedSteps);
  
    const stepResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map(content => ({
        role: "user",
        content
      }))
    });

    setSteps(s => [...s, ...parseXml(stepResponse.data.response).map((x=>({
      ...x,
      status: 'pending' as const,
    })))]);
  
  }, [prompt]);

  useEffect(() => {
    init();
  }, [init]);


  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-3rem)] max-w-7xl mx-auto min-h-0">
        {/* Steps Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="col-span-12 lg:col-span-3 min-h-0"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full min-h-0">
            <StepsList
              steps={steps}
              currentStep={currentStep}
              onStepClick={(step: Step) => {
                setCurrentStep(step);
              }}
            />
          </div>
        </motion.div>

        {/* File Explorer Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="col-span-12 lg:col-span-3 min-h-0"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full min-h-0">
            <FileExplorer 
              files={files} 
              onFileSelect={setSelectedFile}
            />
          </div>
        </motion.div>

        {/* Code Editor Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="col-span-12 lg:col-span-6 min-h-0"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full min-h-0">
            <CodeEditor files={selectedFile ? [selectedFile] : []} webContainer={webcontainer} />
          </div>
        </motion.div>
      </div>
    </div>
  );  
}