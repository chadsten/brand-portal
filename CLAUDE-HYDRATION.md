  Hydration Error Prevention Checklist

1. Never Use Conditional Early Returns Based on Loading States

  // ❌ BAD - Causes hydration mismatch
  if (!data) {
    return <div>Loading...</div>;
  }

  // ✅ GOOD - Same structure, handle loading internally
  return (
    <div>
      <Button isDisabled={!data}>
        {!data ? "Loading..." : "Action"}
      </Button>
    </div>
  );

2. Always Guard Client-Only APIs

  // ❌ BAD - window/localStorage not available on server
  const [value, setValue] = useState(localStorage.getItem('key'));

  // ✅ GOOD - Check if client-side first
  const [value, setValue] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('key') : null
  );

3. Use useEffect for Client-Only Logic

  // ❌ BAD - Runs during render
  const data = window.innerWidth > 768 ? 'desktop' : 'mobile';

  // ✅ GOOD - Client-only in useEffect
  const [data, setData] = useState('mobile');
  useEffect(() => {
    setData(window.innerWidth > 768 ? 'desktop' : 'mobile');
  }, []);

4. Consistent Hook Usage

  // ❌ BAD - Conditional hooks
  if (!result) {
    const hookA = useAutoResize(value);  // Hook called conditionally
    return <div>No data</div>;
  }

  // ✅ GOOD - Always call hooks
  const hookA = useAutoResize(value || '');
  if (!result) {
    return <div>No data</div>;
  }

5. Use Isomorphic Layout Effects

  // ❌ BAD - useLayoutEffect not available on server
  useLayoutEffect(() => {
    // DOM manipulation
  }, []);

  // ✅ GOOD - Safe for SSR
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    // DOM manipulation
  }, []);

6. Handle Dynamic Content Safely

  // ❌ BAD - Date/random values differ between server/client
  <div>{new Date().toLocaleString()}</div>

  // ✅ GOOD - Client-only dynamic content
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);
  return <div>{currentTime || 'Loading...'}</div>;

7. Safe Loading State Patterns

  // ❌ BAD - Different structure on server/client
  if (isLoading) return <Spinner />;
  return <Content data={data} />;

  // ✅ GOOD - Same structure always
  return (
    <div>
      {isLoading ? <Spinner /> : <Content data={data} />}
    </div>
  );

8. Test with SSR in Mind

- Always test with JavaScript disabled initially
- Use Next.js dev mode which catches hydration errors
- Check browser console for hydration warnings

9. Quick Debug Steps

   When you see hydration errors:
1. Look for conditional returns based on async data
2. Check for client-only APIs (window, localStorage, etc.)
3. Verify hooks are called in same order server/client
4. Look for dynamic content that changes between renders

10. Remember This Pattern

    // The Golden Rule: Same structure, different content
    return (
      <div className="same-structure-always">
        {data ? <RealContent /> : <LoadingContent />}
      </div>
    );
