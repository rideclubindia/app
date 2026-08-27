const fs = require('fs');

function fixAuth(file) {
  let content = fs.readFileSync(file, 'utf8');
  const target = '    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {\n' +
                 '      if (currentUser) {\n' +
                 '        setUser(currentUser);\n' +
                 '        fetchGroups(currentUser);\n' +
                 '      } else {\n' +
                 '        navigate(\'/login\');\n' +
                 '      }\n' +
                 '      setLoadingAuth(false);\n' +
                 '    });';
                 
  const targetProfile = '    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {\n' +
                 '      if (currentUser) {\n' +
                 '        setUser(currentUser);\n' +
                 '        fetchUserData(currentUser.uid);\n' +
                 '      } else {\n' +
                 '        navigate(\'/login\');\n' +
                 '      }\n' +
                 '    });';

  const replacementGroups = '    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {\n' +
                      '      let activeUid = currentUser?.uid;\n' +
                      '      const rieToken = localStorage.getItem(\'rie_token\');\n' +
                      '      if (!activeUid && rieToken) {\n' +
                      '        try {\n' +
                      '          const payload = JSON.parse(atob(rieToken.split(\'.\')[1]));\n' +
                      '          if (payload.uid) activeUid = payload.uid;\n' +
                      '        } catch (e) {}\n' +
                      '      }\n\n' +
                      '      if (activeUid) {\n' +
                      '        const mockUser = currentUser || { uid: activeUid };\n' +
                      '        setUser(mockUser);\n' +
                      '        fetchGroups(mockUser);\n' +
                      '      } else {\n' +
                      '        navigate(\'/login\');\n' +
                      '      }\n' +
                      '      setLoadingAuth(false);\n' +
                      '    });';
                      
  const replacementProfile = '    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {\n' +
                      '      let activeUid = currentUser?.uid;\n' +
                      '      const rieToken = localStorage.getItem(\'rie_token\');\n' +
                      '      if (!activeUid && rieToken) {\n' +
                      '        try {\n' +
                      '          const payload = JSON.parse(atob(rieToken.split(\'.\')[1]));\n' +
                      '          if (payload.uid) activeUid = payload.uid;\n' +
                      '        } catch (e) {}\n' +
                      '      }\n\n' +
                      '      if (activeUid) {\n' +
                      '        setUser(currentUser || { uid: activeUid });\n' +
                      '        fetchUserData(activeUid);\n' +
                      '      } else {\n' +
                      '        navigate(\'/login\');\n' +
                      '      }\n' +
                      '    });';
                      
   // Normalize CRLF to LF for easier matching
   content = content.replace(/\r\n/g, '\n');
   
   if (file.includes('GroupsHMI')) {
     content = content.replace(target, replacementGroups);
   } else if (file.includes('ProfileHMI')) {
     content = content.replace(targetProfile, replacementProfile);
   }
   
   fs.writeFileSync(file, content);
}

fixAuth('src/features/groups/GroupsHMI.tsx');
fixAuth('src/features/profile/ProfileHMI.tsx');
