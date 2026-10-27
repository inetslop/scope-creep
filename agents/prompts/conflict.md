Your finished change for {{TASK_ID}} ({{TASK_TITLE}}) is being rebased onto newer code from the other developers, and git found conflicts in these files:

{{FILES}}

# Why main changed
These commits landed on main after your change was started and touch the conflicted files. Read them first: if one removed or reworked something on purpose, adapt your change to the new code instead of bringing the old code back.

{{UPSTREAM}}

# Your task, for reference
{{TASK_BODY}}

# Resolving
Each conflicted spot looks like:

<<<<<<< HEAD
(the newer code already on main)
||||||| parent of (your commit)
(the code as it was before either change)
=======
(your change)
>>>>>>> (your commit)

Compare both sides with the middle section to see what each one changed, then edit each file so it keeps BOTH intents: the newer code from main AND your task's change. Spots where both sides only added lines were already resolved for you (both kept). Remove every marker line, including the `|||||||` one. Do not run git commands. Run `npm run check` to make sure everything compiles and tests pass. End with:

SUMMARY: <how you resolved it>
STATUS: DONE
