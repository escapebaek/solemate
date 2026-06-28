'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, Trash2, Loader2, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  user_id: string
  display_name: string
  content: string
  created_at: string
  likes: number
  dislikes: number
  my_vote: 1 | -1 | null
}

interface Props {
  shoeRef: string
  currentUserId: string | null
  currentUserEmail: string | null
}

export default function ShoeComments({ shoeRef, currentUserId, currentUserEmail }: Props) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    const { data: rows } = await supabase
      .from('shoe_comments')
      .select('*')
      .eq('shoe_ref', shoeRef)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!rows || rows.length === 0) {
      setComments([])
      setLoading(false)
      return
    }

    const ids = rows.map((r: { id: string }) => r.id)
    const { data: votes } = await supabase
      .from('comment_votes')
      .select('comment_id, user_id, vote')
      .in('comment_id', ids)

    type VoteRow = { comment_id: string; user_id: string; vote: number }
    const merged: Comment[] = rows.map((row: Record<string, unknown>) => {
      const rowVotes: VoteRow[] = (votes as VoteRow[] | null)?.filter((v: VoteRow) => v.comment_id === row.id) ?? []
      const likes = rowVotes.filter((v: VoteRow) => v.vote === 1).length
      const dislikes = rowVotes.filter((v: VoteRow) => v.vote === -1).length
      const myVoteRow = currentUserId ? rowVotes.find((v: VoteRow) => v.user_id === currentUserId) : undefined
      const my_vote = (myVoteRow?.vote as 1 | -1 | undefined) ?? null
      return { ...row, likes, dislikes, my_vote }
    })

    setComments(merged)
    setLoading(false)
  }, [shoeRef, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadComments()
  }, [loadComments])

  async function submitComment() {
    if (!text.trim() || !currentUserId) return
    setSubmitting(true)
    const displayName = currentUserEmail?.split('@')[0] ?? 'Runner'
    const { error } = await supabase.from('shoe_comments').insert({
      shoe_ref: shoeRef,
      user_id: currentUserId,
      display_name: displayName,
      content: text.trim(),
    })
    if (!error) {
      setText('')
      await loadComments()
    }
    setSubmitting(false)
  }

  async function handleVote(commentId: string, vote: 1 | -1) {
    if (!currentUserId) return
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    if (comment.my_vote === vote) {
      await supabase.from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', currentUserId)
    } else if (comment.my_vote !== null) {
      await supabase.from('comment_votes')
        .update({ vote })
        .eq('comment_id', commentId)
        .eq('user_id', currentUserId)
    } else {
      await supabase.from('comment_votes').insert({
        comment_id: commentId,
        user_id: currentUserId,
        vote,
      })
    }
    await loadComments()
  }

  async function deleteComment(commentId: string) {
    await supabase.from('shoe_comments').delete().eq('id', commentId).eq('user_id', currentUserId!)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
  }

  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <h2 className="text-[0.62rem] tracking-[0.28em] text-[var(--stone)] uppercase font-medium">
          Community {comments.length > 0 && `(${comments.length})`}
        </h2>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Comment input */}
      {currentUserId ? (
        <div className="luxury-card p-4 mb-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your experience with this shoe..."
            maxLength={500}
            rows={3}
            className="input-luxury w-full resize-none text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[0.62rem] text-[var(--stone-light)]">{text.length}/500</span>
            <button
              onClick={submitComment}
              disabled={!text.trim() || submitting}
              className="btn-primary py-1.5 px-4 text-xs gap-1.5 disabled:opacity-40"
            >
              {submitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              Post
            </button>
          </div>
        </div>
      ) : (
        <div className="luxury-card p-5 mb-4 text-center">
          <p className="text-xs text-[var(--stone)]">Sign in to leave a comment</p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="luxury-card p-8 text-center">
          <p className="text-sm text-[var(--stone)]">No comments yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="luxury-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[0.7rem] font-semibold text-[var(--ink)] tracking-wide truncate">
                    {c.display_name}
                  </span>
                  <span className="text-[0.62rem] text-[var(--stone-light)] shrink-0">
                    {new Date(c.created_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit',
                    })}
                  </span>
                </div>
                {c.user_id === currentUserId && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-[var(--stone-light)] hover:text-[var(--danger)] transition-colors shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <p className="text-sm text-[var(--ink-mid)] leading-relaxed whitespace-pre-wrap break-words">
                {c.content}
              </p>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <button
                  onClick={() => handleVote(c.id, 1)}
                  disabled={!currentUserId}
                  className={`flex items-center gap-1.5 text-xs transition-colors disabled:cursor-default ${
                    c.my_vote === 1
                      ? 'text-[var(--safe)] font-semibold'
                      : 'text-[var(--stone)] hover:text-[var(--ink)]'
                  }`}
                >
                  <ThumbsUp size={12} />
                  <span>{c.likes}</span>
                </button>
                <button
                  onClick={() => handleVote(c.id, -1)}
                  disabled={!currentUserId}
                  className={`flex items-center gap-1.5 text-xs transition-colors disabled:cursor-default ${
                    c.my_vote === -1
                      ? 'text-[var(--danger)] font-semibold'
                      : 'text-[var(--stone)] hover:text-[var(--ink)]'
                  }`}
                >
                  <ThumbsDown size={12} />
                  <span>{c.dislikes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
