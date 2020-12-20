# TeamPass Helper

Simple tool to get credentials from TeamPass.

## How to run
1. Setup environemntal variables in your OS: 
   * `TEAMPASS_USER` - TeamPass username,
   * `TEAMPASS_PASSWORD` - TeamPass password.
2. Run `yarn install` to install dependencies.
3. You can either:
   * run `yarn link` in order to be able to execute tool
     independently of current directory by running:
     `teampass example.com dashboard`,
   * or navigate to directory containing the tool and run
     `node index.js example.com dashboard`,
     
    where `example.com dahsboard` is a query string you would
    normally type in the TeamPass' search input.
   
## FAQ
### Why wrong item is being displayed?
If the query is ambiguous, only the first result is returned.
Try to type in more precise query strings.

### Why the tool does not show the password?
At the moment, password is copied to the clipboard and is
never displayed.

### Why is it so slow?
Currently everytime you run the tool, login action is being
performed and it is slow due to TeamPass' implementation of
authentication process. In the future, the tool will try to
restore previous session in order to skip the login process.