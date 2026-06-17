# Instrumentation Journey — Series Roadmap

> Most engineers know how to use the tools. Few know when not to trust them.

One technique. One tool. One challenge per chapter — all built on the same app.
By the end, you'll know which instrument fits the situation and have the discipline
to question your findings before acting on them.

---

## App

**InstrumentationJourney** — native Swift iOS app.
Each chapter adds a new challenge screen to the same binary.
No source code provided to the reader. All investigation happens at runtime.

---

## Chapters

### Chapter 01 — The Observer
**Tool:** LLDB  
**Concept:** What is a process? What is a debugger? What is runtime memory?

**Challenge:** The app shows a text field asking for a hidden unlock code.
The code is never displayed in the UI. It exists in memory while the app is running.
Find it by observing the running process.

**Mechanic:** A string is assembled from parts at runtime, stored in memory,
and compared against user input. Never hardcoded as a plain string in the binary.

**Key question for the reader:** If the application can access it, can you find it
without source code?

---

### Chapter 02 — The Messenger
**Tool:** LLDB + ObjC runtime APIs (`class_copyMethodList`, `method_getName`)  
**Concept:** How Objective-C dispatches method calls. `objc_msgSend`, SEL, IMP, `method_t`.

**Challenge:** A button in the app has no visible label. Tapping it triggers
an action that leaves no log output. Identify the method being called and
the class it belongs to — without source code.

**Mechanic:** Set a breakpoint on `objc_msgSend`. When the button is tapped,
read the receiver and selector from the registers (x0 = receiver, x1 = selector).
Cross-reference with the runtime method list.

**Key question for the reader:** Every ObjC method call goes through one function.
What does that mean for observation? What does it mean for what comes next?

---

### Chapter 03 — The Interceptor
**Tool:** ObjC runtime (`method_exchangeImplementations`) — no external library  
**Concept:** Method swizzling. The first modification in the series.

**Challenge:** The app enforces a five-minute cooldown before unlocking the next chapter.
The timer is real. Bypass it by swapping the implementation of the method
that reads the elapsed time — without modifying the binary.

**Mechanic:** Swizzle `Date.init` or the method responsible for reading the stored
timestamp. Make the app believe enough time has passed.

**Key question for the reader:** You've changed the behavior of a running app
without touching its code. Where is the line between instrumentation and tampering?
And if you can do this, what stops someone else from doing it to your app?

---

### Chapter 04 — The Linker
**Tool:** LLDB + `otool` / `dyldinfo`  
**Concept:** How `dyld` resolves symbols at runtime. Lazy binding, symbol stubs,
the import address table (IAT/GOT).

**Challenge:** The app calls a C function from the system that influences
its behavior. Identify the function by observing the dynamic linker resolve it
on first call — before any hook is set.

**Mechanic:** Set a breakpoint on `dyld_stub_binder`. Watch it fire the first time
the C function is called. Read the symbol name from the stub. Use `otool -l`
to inspect the lazy symbol table and confirm.

**Key question for the reader:** Every imported C function passes through
the import table before it runs. What would happen if that table pointed somewhere else?

---

### Chapter 05 — The Import Rewriter
**Tool:** [fishhook](https://github.com/facebook/fishhook)  
**Concept:** Patching the GOT at runtime. Redirecting C function calls
at the import table level.

**Challenge:** The app uses `arc4random_uniform` to generate a validation code
that changes on every launch. Hook the function to always return a known value
and unlock the chapter without brute force.

**Mechanic:** `rebind_symbols` replaces the function pointer in the GOT.
From that point forward, every call to `arc4random_uniform` from the app's
binary hits your implementation first.

**Key question for the reader:** fishhook only works on imported symbols.
What happens when the function you need to hook is defined inside the binary itself?

---

### Chapter 06 — The Inline Hook
**Tool:** [Dobby](https://github.com/jmpews/Dobby)  
**Concept:** Inline hooking. Writing a trampoline at a function's address.
Patching machine code at runtime.

**Challenge:** The app has an internal validation function written in Swift.
It's not an ObjC method (swizzling won't reach it) and it's not in the import
table (fishhook won't reach it). Hook it.

**Mechanic:** Resolve the function's runtime address using `image lookup -n`
in LLDB plus ASLR offset. Use `DobbyHook` to plant a trampoline.
The original function is still callable from your hook via the backup pointer.

**Key question for the reader:** You've now hooked at three different layers:
dispatch table, import table, and machine code. How would you decide which
to use in a real investigation?

---

### Chapter 07 — The Toolkit
**Tool:** [Frida](https://frida.re)  
**Concept:** Dynamic instrumentation at scale. JS scripting, `Interceptor.attach`,
ObjC bridge, Stalker for execution tracing.

**Challenge:** The app activates three protections simultaneously: an ObjC gate,
an internal Swift function, and a C timer. Write a single Frida script
that bypasses all three in one run — no recompilation, no binary modification.

**Mechanic:** `ObjC.classes.ClassName['- methodName'].implementation` for the ObjC gate.
`Interceptor.attach(Module.findExportByName(null, 'symbol'), ...)` for the C function.
`Interceptor.attach(ptr('0x...'), ...)` with the resolved address for the Swift function.

**Key question for the reader:** Frida abstracts everything from the previous chapters
into a scripting layer. What does that mean for speed of investigation?
What does it cost in terms of understanding?

---

### Chapter 08 — The Real Target  *(Epilogue)*
**Target:** A real Flutter binary with `ptrace(PT_DENY_ATTACH, 0, 0, 0)`  
**Concept:** Applying the full toolkit to a binary you didn't write,
with a protection designed to prevent exactly what you're trying to do.

**Challenge:** The binary calls `ptrace` to deny debugger attachment.
Run a debug build on a physical device without being attached to Xcode.
No source code. No entitlement changes.

**Path to solution (intentionally not prescribed):**
The reader must choose their own approach:
- Identify `ptrace` in the import table (`otool`, LLDB) — Ch04 skills
- Hook it via fishhook before it fires — Ch05 skills
- Or hook it inline with Dobby — Ch06 skills
- Or intercept at spawn time with Frida — Ch07 skills

Each approach works. Each has a trade-off. That trade-off is the lesson.

**Closing question:** You bypassed a protection in a binary you've never seen before,
using techniques you built from scratch across seven chapters.
Now ask yourself: what would it take to protect against this?

---

## Jailbreak Tools — Out of Scope (for now)

Substrate (MobileSubstrate), ElleKit, and related tools operate via dylib injection
into a sandboxed process — a capability that requires a jailbroken device.
The attack surface, trust model, and developer audience are different enough
to warrant a separate series or dedicated section.

These tools sit on top of the same primitives taught in this series.
After completing the Journey, a reader is well-positioned to understand them.

---

## Series arc

```
Observe → Understand dispatch → Modify dispatch →
Understand linking → Modify linking → Modify machine code →
Combine everything → Apply to the real world
```

Each chapter answers one question the previous chapter leaves open.
The last chapter answers no question — it asks one instead.
