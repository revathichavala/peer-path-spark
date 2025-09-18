import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, MessageCircle, Plus, Send, Users } from "lucide-react";
import peerSupportImage from "@/assets/peer-support.jpg";

interface PeerSupportCommunityProps {
  onBack: () => void;
}

const SAMPLE_POSTS = [
  {
    id: '1',
    author: 'Anonymous Student',
    timeAgo: '2h ago',
    content: 'Feeling overwhelmed with midterms coming up. Anyone else struggling with the academic pressure? Looking for some study tips that actually work.',
    responses: 12,
    hearts: 8,
    category: 'Academic'
  },
  {
    id: '2',
    author: 'Peer Supporter',
    timeAgo: '4h ago',
    content: 'Reminder: Its okay to take breaks! I used to think pushing through without rest made me more productive, but I learned that short, regular breaks actually help me focus better. What are your favorite ways to recharge?',
    responses: 24,
    hearts: 31,
    category: 'Self-Care',
    isPeerSupporter: true
  },
  {
    id: '3',
    author: 'Anonymous Student',
    timeAgo: '6h ago',
    content: 'Having a hard time connecting with people on campus. Moved here from across the country and everything feels so different. Missing home but also want to make the most of this experience.',
    responses: 18,
    hearts: 22,
    category: 'Social'
  },
  {
    id: '4',
    author: 'Anonymous Student',
    timeAgo: '1d ago',
    content: 'Started using the breathing exercises from the resource hub and they actually help! Thanks to whoever recommended them. Small wins count too 💙',
    responses: 9,
    hearts: 15,
    category: 'Success Stories'
  }
];

const PEER_GROUPS = [
  { name: 'Academic Support', members: 234, color: 'bg-primary/10 text-primary' },
  { name: 'Social Anxiety', members: 156, color: 'bg-secondary/10 text-secondary' },
  { name: 'Family Challenges', members: 89, color: 'bg-accent/10 text-accent' },
  { name: 'Relationship Issues', members: 198, color: 'bg-warning/10 text-yellow-600' },
  { name: 'Success Stories', members: 312, color: 'bg-success/10 text-success' }
];

export const PeerSupportCommunity = ({ onBack }: PeerSupportCommunityProps) => {
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");

  const handleSubmitPost = () => {
    // In a real app, this would submit to the backend
    console.log("New post:", { content: newPostContent, category: selectedCategory });
    setNewPostContent("");
    setShowNewPost(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-foreground">Peer Support Community</h1>
            <p className="text-muted-foreground">Connect with fellow students in a safe, supportive space</p>
          </div>
          <Button onClick={() => setShowNewPost(true)} variant="wellness">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Peer Groups */}
          <div className="lg:col-span-1">
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Support Groups</h3>
              </div>
              
              <div className="space-y-3">
                {PEER_GROUPS.map((group, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-medium ${group.color}`}>
                          {group.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {group.members} members
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Peer Listeners */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">1:1 Support</h3>
              <div className="text-center">
                <img 
                  src={peerSupportImage} 
                  alt="Peer support" 
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with a trained peer listener for a private conversation
                </p>
                <Button variant="support" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with Peer Listener
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content - Posts */}
          <div className="lg:col-span-3">
            {/* New Post Modal */}
            {showNewPost && (
              <Card className="p-6 mb-6 border-primary/20">
                <h3 className="font-semibold text-foreground mb-4">Share with the Community</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background"
                    >
                      <option>General</option>
                      <option>Academic</option>
                      <option>Social</option>
                      <option>Self-Care</option>
                      <option>Success Stories</option>
                    </select>
                  </div>
                  
                  <Textarea
                    placeholder="Share what's on your mind... Remember, this is a safe space for all students."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowNewPost(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitPost} variant="wellness">
                      <Send className="w-4 h-4 mr-2" />
                      Post Anonymously
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {SAMPLE_POSTS.map((post) => (
                <Card key={post.id} className="p-6 hover:shadow-comfort transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        post.isPeerSupporter 
                          ? 'bg-secondary text-secondary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{post.author}</span>
                          {post.isPeerSupporter && (
                            <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                              Peer Supporter
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{post.timeAgo}</span>
                      </div>
                    </div>
                    
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      post.category === 'Academic' ? 'bg-primary/10 text-primary' :
                      post.category === 'Self-Care' ? 'bg-secondary/10 text-secondary' :
                      post.category === 'Social' ? 'bg-accent/10 text-accent' :
                      post.category === 'Success Stories' ? 'bg-success/10 text-success' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {post.category}
                    </span>
                  </div>

                  <p className="text-foreground leading-relaxed mb-4">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <button className="flex items-center gap-2 hover:text-destructive transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{post.hearts}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.responses} responses</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Community Guidelines */}
            <Card className="mt-8 p-6 bg-muted/20">
              <h3 className="font-semibold text-foreground mb-3">Community Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be respectful and supportive of all community members</li>
                <li>• Keep personal information private and respect others' privacy</li>
                <li>• Share experiences, not medical advice</li>
                <li>• If you're in crisis, please contact emergency services or a counselor</li>
                <li>• Report any concerning posts to peer supporters</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};