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
    <div className="flex flex-col lg:flex-row h-screen overflow-auto">
      <div className="w-full lg:w-64 bg-zinc-900 p-4 flex flex-col border border-sky-500/20 rounded-xl mb-4 lg:mb-0">
        <StepsList
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step: Step) => {
            setCurrentStep(step);
          }}
        />
      </div>
  
      <div className="w-full lg:w-64 bg-zinc-900 p-4 flex flex-col border border-sky-500/20 rounded-xl mb-4 lg:mb-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileExplorer 
              files={files} 
              onFileSelect={setSelectedFile}
            />
          </div>
        </div>
      </div>
  
      <div className="flex-1 bg-sky-500/5 border border-sky-500/20 rounded-xl h-[60vh] lg:h-full overflow-auto">
        <CodeEditor files={selectedFile ? [selectedFile] : []} webContainer={webcontainer} />
      </div>
    </div>
  );  
}
