import React, { useState, useEffect } from "react"
import {motion, AnimatePresence} from 'framer-motion';
import {useSnapshot}  from 'valtio';
import config from '../config/config';
import state from "../store";
import {download} from '../assets';
import { downloadCanvasToImage, reader} from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes}  from '../config/constants';
import { fadeAnimation, slideAnimation } from "../config/motion";
import { AIPicker, ColorPicker, CustomButton, FilePicker, Tab } from "../components";

const Customizer = () => {
  const snap = useSnapshot(state);
  const[file, setFile] = useState('');
  const[prompt, setPrompt] = useState('');
  const[generatingImg, setgeneratingImg] = useState(false);

  const[activeEditorTab, setActiveEditorTab] = useState(false);
  const[activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    styleishShirt: false
  });

  const handleSubmit = async (type) =>{
      if (!prompt) return alert("Please enter a prompt");
     
      try {
        // call back end to generate an ai image
        setgeneratingImg(true);
        const response =  await fetch("http://localhost:8080/api/v1/dalle",{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt
          })
        });

        const data = await response.json();

       handleDecals(type, `data:image/png;base64,${data.photo}`)
      } catch (error) {
        alert(error)
      } finally {
        setgeneratingImg(false);
        setActiveEditorTab("");
      }
  }
  
  // show tab content depending on the active tab
  const generateTabContent = () => {
   
     switch(activeEditorTab) {
         case "colorpicker":
          return <ColorPicker />
         case "filepicker":
          return <FilePicker file={file} setFile={setFile} readFile={readFile} />
         case "aipicker":
           return <AIPicker 
                    prompt={prompt} 
                    setPrompt={setPrompt}
                    generatingImg={generatingImg}
                    setgeneratingImg = {setgeneratingImg}
                    handleSubmit={handleSubmit}/>
         default: 
            return null; 
     }
  }

  const handleDecals = (type, result) =>{
    const decalType =  DecalTypes[type];

    state[decalType.stateProperty] = result;

    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab)
    }
  }

  const handleActiveFilterTab = (tabname) => {
    switch(tabname) {
      case "logoShirt":
        state.isLogoTexture =  !activeFilterTab[tabname];
        break;
      case "stylishShirt":
        state.isFullTexture =  !activeFilterTab[tabname];
        break;
      default: 
         state.isFullTexture = false
         state.isLogoTexture = true;
         break;
  }
  setActiveFilterTab((prevState) => {
    return {
      ...prevState,
      [tabname]: !prevState[tabname]
    }
  })
  }

  const readFile = (type) =>{
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("")
    })
  }

  return (
     <AnimatePresence>
        {!snap.intro && (
          <>
           <motion.div key="custom" 
           className="absolute top-0 left-0 z-10"
           {...slideAnimation('left')}>
            <div className="flex icon-center min-h-screen">
              <div className="editortabs-container tabs">
                 {EditorTabs.map((tab) => (
                 <Tab 
                   key={tab.name}
                   tab={tab} 
                   handleClick={()=>setActiveEditorTab(tab.name)} />))}
                   {generateTabContent()}
              </div>
            </div>
           </motion.div>
           <motion.div
            className="absolute z-10 top-5 right-5" 
             {...fadeAnimation}>
                <CustomButton type="filled" 
                title="Go Back" 
                handleClick={()=> state.intro = true}
                customStyles="w-fit px-4 py-2.5 font-bold text-sm"/>
           </motion.div>

           <motion.div
              className="filtertabs-container" {...slideAnimation("up")}>
                {
                FilterTabs.map((tab) => (
                   <Tab 
                   key={tab.name}
                   tab={tab} 
                   isFilterTab
                   isActiveTab={activeFilterTab[tab.name]}
                   handleClick={()=> handleActiveFilterTab(tab.name)} />
                 ))}
        
           </motion.div>
          </>
        )}
     </AnimatePresence>
  )
}

export default Customizer