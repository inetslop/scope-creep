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
=======
(your change)
>>>>>>> (your commit)

Edit each file so it keeps BOTH intents: the newer code from main AND your task's change. Remove every marker line. Do not run git commands. Run `npm run check` to make sure everything compiles and tests pass. End with:

SUMMARY: <how you resolved it>
STATUS: DONE
