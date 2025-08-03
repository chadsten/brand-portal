# Node.js Process Management Commands

## Problem Prevention
- **MAX 2 Node.js processes**: Port 3000 (main) + Port 3001 (testing only)
- Always clean up test processes immediately after use
- Check process count before starting new servers

## Working Cleanup Commands

### List All Node Processes
```bash
tasklist | findstr node.exe
```

### Kill Processes (Working Syntax)
```bash
# Use double slashes to escape paths in bash
taskkill //F //PID <process_id>

# For multiple high-RAM processes:
taskkill //F //PID 4248
taskkill //F //PID 14644
taskkill //F //PID 42348
```

### Check Port Usage
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Start Clean Development Server
```bash
cd "C:\Users\Chadsten\Documents\reactJSBrandPortal"
npm run dev
```

## Protocol for Testing
1. **Before Testing**: Check current Node processes with `tasklist | findstr node.exe`
2. **If >2 Processes**: Kill excess processes using `taskkill //F //PID <id>`
3. **Start Test Server**: Only if needed, on port 3001
4. **After Testing**: Immediately kill test server
5. **Keep Clean**: Maintain only main dev server on 3000

## RAM Usage Guidelines
- Single dev server: ~200MB RAM
- Total acceptable: <500MB for 2 processes
- If >1GB total: Clean up immediately

**Last Updated**: 2025-07-29
**Tested Working Commands**: ✅ Verified functional on Windows in bash environment